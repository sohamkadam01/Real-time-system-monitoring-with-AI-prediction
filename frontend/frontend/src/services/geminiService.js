// // google gemini step 2 from deepseek
// import { GoogleGenerativeAI } from '@google/generative-ai';

// class GeminiService {
//   constructor() {
//     // Get API key from environment variable
//     const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
//     if (!apiKey) {
//       console.warn('⚠️ Gemini API key not found. Set VITE_GEMINI_API_KEY in .env file');
//       this.enabled = false;
//       return;
//     }
    
//     try {
//       this.genAI = new GoogleGenerativeAI(apiKey);
//       this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
//       this.enabled = true;
//       console.log('✅ Gemini AI initialized');
//     } catch (error) {
//       console.error('❌ Gemini AI initialization failed:', error);
//       this.enabled = false;
//     }
//   }

//   async analyzeSystemMetrics(metrics) {
//     if (!this.enabled || !this.model) {
//       return {
//         enabled: false,
//         insights: ['AI analysis disabled. Enable Gemini API for intelligent insights.']
//       };
//     }

//     try {
//       const prompt = this.createAnalysisPrompt(metrics);
//       const result = await this.model.generateContent(prompt);
//       const response = await result.response;
//       const text = response.text();
      
//       return this.parseAIResponse(text, metrics);
//     } catch (error) {
//       console.error('Gemini AI analysis error:', error);
//       return {
//         enabled: true,
//         error: 'AI analysis failed',
//         insights: ['AI service temporarily unavailable.']
//       };
//     }
//   }

//   createAnalysisPrompt(metrics) {
//     const { dashboard, cpu, memory, disks, processes, alerts } = metrics;
    
//     return `
//     You are an expert system administrator analyzing server metrics in real-time.
    
//     CURRENT SYSTEM METRICS:
    
//     1. CPU: ${dashboard?.cpuUsage?.toFixed(1) || 0}% usage
//        - Cores: ${cpu?.logicalCores || 0} logical, ${cpu?.physicalCores || 0} physical
//        - Load averages: ${cpu?.loadAverages?.map(l => l?.toFixed(2)).join(', ') || 'N/A'}
    
//     2. MEMORY: ${dashboard?.memoryUsage?.toFixed(1) || 0}% used
//        - Total: ${this.formatBytes(memory?.total || 0)}
//        - Available: ${this.formatBytes(memory?.available || 0)}
    
//     3. DISKS: ${disks?.length || 0} disks
//        ${disks?.map(d => `- ${d.name}: ${d.usagePercentage?.toFixed(1)}% used`).join('\n') || 'No disk data'}
    
//     4. PROCESSES: ${processes?.length || 0} top processes
//        ${processes?.slice(0, 3).map(p => `- ${p.name}: ${p.cpuUsage?.toFixed(1)}% CPU`).join('\n') || 'No process data'}
    
//     5. ALERTS: ${alerts?.length || 0} active alerts
//        ${alerts?.map(a => `- ${a.type}: ${a.message}`).join('\n') || 'No active alerts'}
    
//     6. SYSTEM STATUS: ${dashboard?.status || 'UNKNOWN'}
    
//     ANALYSIS REQUEST:
//     1. Provide 3-5 key insights about system health
//     2. Identify potential bottlenecks or issues
//     3. Suggest optimization recommendations
//     4. Predict potential problems in next 1 hour
//     5. Rate system health from 1-10 (10 = perfect)
    
//     Format response as JSON:
//     {
//       "healthScore": number (1-10),
//       "insights": ["insight1", "insight2", ...],
//       "recommendations": ["rec1", "rec2", ...],
//       "predictions": ["prediction1", "prediction2", ...],
//       "bottlenecks": ["bottleneck1", "bottleneck2", ...],
//       "summary": "one line summary"
//     }
    
//     Be concise, technical, and actionable. Focus on critical issues first.
//     `;
//   }

//   parseAIResponse(text, metrics) {
//     try {
//       // Extract JSON from response (Gemini might add extra text)
//       const jsonMatch = text.match(/\{[\s\S]*\}/);
//       if (jsonMatch) {
//         const parsed = JSON.parse(jsonMatch[0]);
//         return {
//           enabled: true,
//           timestamp: new Date().toISOString(),
//           ...parsed,
//           rawMetrics: this.summarizeMetrics(metrics)
//         };
//       }
      
//       // Fallback if no JSON found
//       return {
//         enabled: true,
//         timestamp: new Date().toISOString(),
//         insights: [text.substring(0, 200) + '...'],
//         summary: 'AI Analysis Complete',
//         healthScore: this.calculateHealthScore(metrics)
//       };
//     } catch (error) {
//       console.error('Failed to parse AI response:', error);
//       return {
//         enabled: true,
//         error: 'Failed to parse AI response',
//         insights: ['AI analysis completed but format error occurred.'],
//         summary: 'Analysis Complete',
//         healthScore: this.calculateHealthScore(metrics)
//       };
//     }
//   }

//   calculateHealthScore(metrics) {
//     const { dashboard, alerts } = metrics;
//     let score = 10;
    
//     // Deduct for CPU usage
//     if (dashboard?.cpuUsage > 90) score -= 4;
//     else if (dashboard?.cpuUsage > 70) score -= 2;
    
//     // Deduct for memory usage
//     if (dashboard?.memoryUsage > 90) score -= 3;
//     else if (dashboard?.memoryUsage > 80) score -= 1;
    
//     // Deduct for alerts
//     const criticalAlerts = alerts?.filter(a => a.level === 'CRITICAL').length || 0;
//     const warningAlerts = alerts?.filter(a => a.level === 'WARNING').length || 0;
//     score -= (criticalAlerts * 2 + warningAlerts * 1);
    
//     return Math.max(1, Math.min(10, score));
//   }

//   summarizeMetrics(metrics) {
//     return {
//       cpuUsage: metrics.dashboard?.cpuUsage,
//       memoryUsage: metrics.dashboard?.memoryUsage,
//       diskCount: metrics.disks?.length,
//       processCount: metrics.processes?.length,
//       alertCount: metrics.alerts?.length,
//       status: metrics.dashboard?.status
//     };
//   }

//   formatBytes(bytes) {
//     if (bytes < 1024) return bytes + ' B';
//     const kb = bytes / 1024;
//     if (kb < 1024) return kb.toFixed(1) + ' KB';
//     const mb = kb / 1024;
//     if (mb < 1024) return mb.toFixed(1) + ' MB';
//     const gb = mb / 1024;
//     return gb.toFixed(1) + ' GB';
//   }
// }

// // Singleton instance
// const geminiService = new GeminiService();
// export default geminiService;


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
    
    Be concise, technical, and actionable. Focus on critical issues first.
    `;
  }

  parseAIResponse(text, metrics) {
    try {
      // Extract JSON from response (Gemini might add extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
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
        insights: [text.substring(0, 200) + '...'],
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