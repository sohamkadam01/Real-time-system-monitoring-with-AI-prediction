import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    // Get API key from environment variable
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ Gemini API key not found. Set VITE_GEMINI_API_KEY in .env file');
      this.enabled = false;
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      this.enabled = true;
      console.log('✅ Gemini AI initialized');
    } catch (error) {
      console.error('❌ Gemini AI initialization failed:', error);
      this.enabled = false;
    }
  }

  async analyzeSystemMetrics(metrics) {
    if (!this.enabled || !this.model) {
      return {
        enabled: false,
        insights: ['AI analysis disabled. Enable Gemini API for intelligent insights.']
      };
    }

    try {
      const prompt = this.createAnalysisPrompt(metrics);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseAIResponse(text, metrics);
    } catch (error) {
      console.error('Gemini AI analysis error:', error);
      return {
        enabled: true,
        error: 'AI analysis failed',
        insights: ['AI service temporarily unavailable.']
      };
    }
  }

  async analyzeProcess(processData, contextMetrics) {
    if (!this.enabled || !this.model) {
      return {
        enabled: false,
        predictions: [{
          type: 'AI_DISABLED',
          confidence: 0,
          message: 'AI analysis disabled. Enable Gemini API for intelligent predictions.',
          severity: 'low',
          timestamp: new Date().toISOString()
        }]
      };
    }

    try {
      const prompt = this.createProcessAnalysisPrompt(processData, contextMetrics);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseProcessResponse(text, processData);
    } catch (error) {
      console.error('Gemini process analysis error:', error);
      return {
        enabled: true,
        error: 'Process analysis failed',
        predictions: []
      };
    }
  }

  createProcessAnalysisPrompt(processData, contextMetrics) {
    const { cpu, memory, dashboard } = contextMetrics || {};
    
    // Safely format numbers
    const safeToFixed = (value) => {
      if (value === undefined || value === null) return '0.0';
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return '0.0';
      return num.toFixed(1);
    };
    
    // Format memory in GB for better readability
    const memoryGB = (processData.memoryUsage || 0) / (1024 * 1024 * 1024);
    
    return `
    You are an expert system administrator analyzing individual process behavior.
    
    PROCESS TO ANALYZE:
    - Name: ${processData.name || 'Unknown'}
    - PID: ${processData.pid || 'N/A'}
    - CPU Usage: ${safeToFixed(processData.cpuUsage)}%
    - Memory Usage: ${memoryGB.toFixed(2)} GB (${this.formatBytes(processData.memoryUsage || 0)})
    - Thread Count: ${processData.threadCount || 0}
    - State: ${processData.state || 'UNKNOWN'}
    ${processData.cpuUsageTrend !== undefined ? `- CPU Trend: ${safeToFixed(processData.cpuUsageTrend)}% change` : ''}
    ${processData.memoryTrend !== undefined ? `- Memory Trend: ${safeToFixed(processData.memoryTrend)}% change` : ''}
    
    SYSTEM CONTEXT (Optional):
    ${dashboard ? `- Overall CPU: ${safeToFixed(dashboard.cpuUsage)}%` : ''}
    ${dashboard ? `- Overall Memory: ${safeToFixed(dashboard.memoryUsage)}%` : ''}
    ${cpu ? `- Load Averages: ${cpu.loadAverages?.map(l => l >= 0 ? safeToFixed(l) : 'N/A').join(', ') || 'N/A'}` : ''}
    
    ANALYSIS REQUEST:
    Predict potential issues for this process in the next 5-60 minutes based on:
    1. Current resource consumption patterns
    2. Typical behavior for similar processes
    3. System-wide resource availability
    4. Common failure modes
    
    Focus on predicting:
    - CPU spikes or excessive resource consumption
    - Memory leaks or out-of-memory crashes
    - Process hangs or deadlocks
    - Thread exhaustion
    - Performance degradation
    
    Format response as JSON array of predictions:
    [
      {
        "type": "CPU_SPIKE" | "CRASH_RISK" | "HANG_RISK" | "MEMORY_LEAK" | "PERFORMANCE_DEGRADATION",
        "confidence": number (0-100),
        "message": "Clear explanation of the prediction",
        "severity": "low" | "medium" | "high",
        "predictionTimeframe": "5 minutes" | "15 minutes" | "30 minutes" | "1 hour",
        "suggestedAction": "Specific action to prevent or mitigate",
        "probabilityFactors": ["factor1", "factor2"]
      },
      ...more predictions
    ]
    
    IMPORTANT: Return ONLY valid JSON. No additional text before or after the JSON array.
    
    Be realistic and data-driven. Only predict issues with at least 50% confidence.
    Include specific timeframes and actionable recommendations.
    `;
  }

  parseProcessResponse(text, processData) {
    try {
      // Clean the text - remove markdown code blocks if present
      let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to find JSON array in the response
      const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonMatch) {
        const predictions = JSON.parse(jsonMatch[0]);
        
        // Validate and enhance predictions
        const enhancedPredictions = predictions.map(pred => ({
          type: pred.type || 'GENERAL_ISSUE',
          confidence: Math.max(0, Math.min(100, pred.confidence || 50)),
          message: pred.message || 'Issue detected',
          severity: pred.severity || (pred.confidence > 70 ? 'high' : pred.confidence > 50 ? 'medium' : 'low'),
          predictionTimeframe: pred.predictionTimeframe || '30 minutes',
          suggestedAction: pred.suggestedAction || 'Monitor closely',
          probabilityFactors: pred.probabilityFactors || [],
          timestamp: new Date().toISOString(),
          pid: processData.pid,
          processName: processData.name
        }));
        
        return {
          enabled: true,
          predictions: enhancedPredictions,
          timestamp: new Date().toISOString()
        };
      }
      
      // If no JSON array found, try to extract structured information
      console.warn('No valid JSON array found in response, attempting to parse text:', cleanedText.substring(0, 200));
      
      // Create fallback prediction based on text content
      const fallbackPredictions = [];
      
      if (cleanedText.toLowerCase().includes('cpu') || cleanedText.toLowerCase().includes('spike')) {
        fallbackPredictions.push({
          type: 'CPU_SPIKE',
          confidence: 60,
          message: 'Potential CPU usage issue detected',
          severity: 'medium',
          predictionTimeframe: '15 minutes',
          suggestedAction: 'Monitor CPU utilization',
          timestamp: new Date().toISOString()
        });
      }
      
      if (cleanedText.toLowerCase().includes('memory') || cleanedText.toLowerCase().includes('leak')) {
        fallbackPredictions.push({
          type: 'MEMORY_LEAK',
          confidence: 55,
          message: 'Potential memory issue detected',
          severity: 'medium',
          predictionTimeframe: '30 minutes',
          suggestedAction: 'Check for memory growth patterns',
          timestamp: new Date().toISOString()
        });
      }
      
      if (fallbackPredictions.length === 0) {
        fallbackPredictions.push({
          type: 'ANALYSIS_COMPLETE',
          confidence: 60,
          message: 'AI analysis completed. Process appears stable.',
          severity: 'low',
          predictionTimeframe: '1 hour',
          suggestedAction: 'Continue monitoring',
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        enabled: true,
        predictions: fallbackPredictions,
        timestamp: new Date().toISOString(),
        rawResponse: cleanedText.substring(0, 500) // Include part of raw response for debugging
      };
      
    } catch (error) {
      console.error('Failed to parse process AI response:', error, 'Response text:', text?.substring(0, 200));
      return {
        enabled: true,
        error: 'Failed to parse AI response',
        predictions: [{
          type: 'PARSE_ERROR',
          confidence: 0,
          message: 'Failed to parse AI response format',
          severity: 'low',
          timestamp: new Date().toISOString()
        }]
      };
    }
  }

  createAnalysisPrompt(metrics) {
    const { dashboard, cpu, memory, disks, processes, alerts } = metrics;
    
    // Safely format numbers to prevent errors
    const safeToFixed = (value) => {
      if (value === undefined || value === null) return '0.0';
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return '0.0';
      return num.toFixed(1);
    };
    
    // Safely format disk usage
    const diskInfo = disks?.map(d => {
      const usage = d.usagePercentage !== undefined ? 
        safeToFixed(d.usagePercentage) : '0.0';
      return `- ${d.name || 'Unknown'}: ${usage}% used`;
    }).join('\n') || 'No disk data';
    
    // Safely format process CPU usage
    const processInfo = processes?.slice(0, 3).map(p => {
      const cpuUsage = p.cpuUsage !== undefined ?
        safeToFixed(p.cpuUsage) : '0.0';
      const name = p.name || 'Unknown';
      return `- ${name.length > 30 ? name.substring(0, 27) + '...' : name}: ${cpuUsage}% CPU`;
    }).join('\n') || 'No process data';
    
    // Safely format load averages
    const loadAvgStr = cpu?.loadAverages?.map(l => {
      if (l === undefined || l === null || l < 0) return 'N/A';
      return safeToFixed(l);
    }).join(', ') || 'N/A';
    
    return `
    You are an expert system administrator analyzing server metrics in real-time.
    
    CURRENT SYSTEM METRICS:
    
    1. CPU: ${safeToFixed(dashboard?.cpuUsage)}% usage
       - Cores: ${cpu?.logicalCores || 0} logical, ${cpu?.physicalCores || 0} physical
       - Load averages: ${loadAvgStr}
    
    2. MEMORY: ${safeToFixed(dashboard?.memoryUsage)}% used
       - Total: ${this.formatBytes(memory?.total || 0)}
       - Available: ${this.formatBytes(memory?.available || 0)}
    
    3. DISKS: ${disks?.length || 0} disks
    ${diskInfo}
    
    4. PROCESSES: ${processes?.length || 0} top processes
    ${processInfo}
    
    5. ALERTS: ${alerts?.length || 0} active alerts
    ${alerts?.map(a => `- ${a.type || 'Unknown'}: ${a.message || 'No message'}`).join('\n') || 'No active alerts'}
    
    6. SYSTEM STATUS: ${dashboard?.status || 'UNKNOWN'}
    
    ANALYSIS REQUEST:
    1. Provide 3-5 key insights about system health
    2. Identify potential bottlenecks or issues
    3. Suggest optimization recommendations
    4. Predict potential problems in next 1 hour
    5. Rate system health from 1-10 (10 = perfect)
    
    Format response as JSON:
    {
      "healthScore": number (1-10),
      "insights": ["insight1", "insight2", ...],
      "recommendations": ["rec1", "rec2", ...],
      "predictions": ["prediction1", "prediction2", ...],
      "bottlenecks": ["bottleneck1", "bottleneck2", ...],
      "summary": "one line summary"
    }
    
    IMPORTANT: Return ONLY valid JSON. No additional text before or after the JSON.
    
    Be concise, technical, and actionable. Focus on critical issues first.
    `;
  }

  parseAIResponse(text, metrics) {
    try {
      // Clean the text - remove markdown code blocks if present
      let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to find JSON in the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          enabled: true,
          timestamp: new Date().toISOString(),
          ...parsed,
          rawMetrics: this.summarizeMetrics(metrics)
        };
      }
      
      // Fallback if no JSON found
      return {
        enabled: true,
        timestamp: new Date().toISOString(),
        insights: [cleanedText.substring(0, 200) + '...'],
        summary: 'AI Analysis Complete',
        healthScore: this.calculateHealthScore(metrics)
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        enabled: true,
        error: 'Failed to parse AI response',
        insights: ['AI analysis completed but format error occurred.'],
        summary: 'Analysis Complete',
        healthScore: this.calculateHealthScore(metrics)
      };
    }
  }

  calculateHealthScore(metrics) {
    const { dashboard, alerts } = metrics;
    let score = 10;
    
    // Safely convert to numbers
    const cpuUsage = this.safeNumber(dashboard?.cpuUsage);
    const memoryUsage = this.safeNumber(dashboard?.memoryUsage);
    
    // Deduct for CPU usage
    if (cpuUsage > 90) score -= 4;
    else if (cpuUsage > 70) score -= 2;
    
    // Deduct for memory usage
    if (memoryUsage > 90) score -= 3;
    else if (memoryUsage > 80) score -= 1;
    
    // Deduct for alerts
    const criticalAlerts = alerts?.filter(a => a.level === 'CRITICAL').length || 0;
    const warningAlerts = alerts?.filter(a => a.level === 'WARNING').length || 0;
    score -= (criticalAlerts * 2 + warningAlerts * 1);
    
    return Math.max(1, Math.min(10, Math.round(score)));
  }

  // Helper method to safely convert to number
  safeNumber(value) {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  }

  summarizeMetrics(metrics) {
    return {
      cpuUsage: this.safeNumber(metrics.dashboard?.cpuUsage),
      memoryUsage: this.safeNumber(metrics.dashboard?.memoryUsage),
      diskCount: metrics.disks?.length,
      processCount: metrics.processes?.length,
      alertCount: metrics.alerts?.length,
      status: metrics.dashboard?.status
    };
  }

  formatBytes(bytes) {
    const safeBytes = this.safeNumber(bytes);
    if (safeBytes < 1024) return safeBytes + ' B';
    const kb = safeBytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    if (mb < 1024) return mb.toFixed(1) + ' MB';
    const gb = mb / 1024;
    return gb.toFixed(1) + ' GB';
  }
}

// Singleton instance
const geminiService = new GeminiService();
export default geminiService;