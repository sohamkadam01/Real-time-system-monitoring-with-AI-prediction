// google gemini step 3 from deepseek

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import geminiService from './geminiService'; // Import Gemini service

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [metrics, setMetrics] = useState(null);
  const [connected, setConnected] = useState(true); // Always true for polling
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [aiInsights, setAiInsights] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const metricsSnapshotRef = useRef(null);

  // Function to fetch metrics from API
  const fetchMetrics = useCallback(async () => {
    try {
      console.log(`📡 Polling #${pollCount + 1}...`);
      
      const response = await fetch('http://localhost:8080/api/monitor/metrics');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMetrics(data);
      setConnected(true);
      setLastUpdate(new Date());
      setPollCount(prev => prev + 1);
      
      // Store snapshot for potential manual AI analysis
      metricsSnapshotRef.current = data;
      
      // Optional: Log success on first few polls
      if (pollCount < 3) {
        console.log('✅ Data fetched successfully:', data?.dashboard ? 'Dashboard data received' : 'No dashboard data');
      }
      
    } catch (err) {
      console.error('❌ Polling error:', err.message);
      setConnected(false);
      
      // Show more specific error messages
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.error('💡 Hint: Make sure backend is running on http://localhost:8080');
      }
    } finally {
      setLoading(false);
    }
  }, [pollCount]);

  // Manual AI analysis trigger
  const triggerManualAnalysis = useCallback(async () => {
    if (!metricsSnapshotRef.current) {
      console.warn('⚠️ No metrics available for analysis');
      return;
    }
    
    // Check if AI service is enabled
    if (!geminiService.enabled) {
      console.warn('⚠️ AI service is not enabled. Please check your API key configuration.');
      setAiEnabled(false);
      return;
    }
    
    // Check if already analyzing
    if (analyzing) {
      console.warn('⚠️ AI analysis already in progress');
      return;
    }
    
    console.log('🔄 Triggering manual AI analysis...');
    setAnalyzing(true);
    
    try {
      const metricsData = metricsSnapshotRef.current;
      console.log('🧠 Analyzing system metrics with AI...');
      
      const insights = await geminiService.analyzeSystemMetrics(metricsData);
      
      // Update AI insights state
      setAiInsights({
        ...insights,
        analysisId: Date.now(),
        timestamp: new Date().toISOString(),
        metricsSnapshot: {
          cpuUsage: metricsData.dashboard?.cpuUsage,
          memoryUsage: metricsData.dashboard?.memoryUsage,
          timestamp: new Date().toISOString()
        },
        triggeredManually: true
      });
      
      setAiEnabled(true);
      
      console.log('✅ Manual AI analysis completed');
      
      // Log insights summary
      if (insights.healthScore) {
        console.log(`🏥 System Health Score: ${insights.healthScore}/10`);
      }
      
    } catch (error) {
      console.error('❌ AI analysis error:', error);
      setAiInsights({
        enabled: true,
        error: error.message,
        timestamp: new Date().toISOString(),
        insights: ['AI analysis failed. Please check API key and connection.'],
        triggeredManually: true
      });
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing]);

  // Manual refresh function
  const refreshMetrics = () => {
    console.log('🔄 Manual refresh requested');
    setLoading(true);
    fetchMetrics();
  };

  // Clear AI insights
  const clearAiInsights = useCallback(() => {
    setAiInsights(null);
    console.log('🧹 AI insights cleared');
  }, []);

  // Check AI service status on mount
  useEffect(() => {
    setAiEnabled(geminiService.enabled);
    if (geminiService.enabled) {
      console.log('🤖 Gemini AI service is enabled (manual triggering only)');
    } else {
      console.log('⚠️ Gemini AI service is disabled. Add VITE_GEMINI_API_KEY to .env');
    }
  }, []);

  // Initialize polling on component mount
  useEffect(() => {
    console.log('🚀 Starting polling system...');
    console.log('🤖 AI analysis will NOT trigger automatically. Use manual trigger only.');
    
    // Initial fetch
    fetchMetrics();
    
    // Set up polling interval (every 3 seconds)
    const intervalId = setInterval(fetchMetrics, 3000);
    
    // Log polling started
    console.log('⏱️  Polling every 3 seconds');
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up polling interval');
      clearInterval(intervalId);
    };
  }, [fetchMetrics]);

  // Format last update time
  const getLastUpdateText = () => {
    if (!lastUpdate) return 'Never updated';
    
    const now = new Date();
    const diffSeconds = Math.floor((now - lastUpdate) / 1000);
    
    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  };

  // Format last AI analysis time
  const getLastAnalysisText = () => {
    if (!aiInsights?.timestamp) return 'Never analyzed';
    
    const now = new Date();
    const analysisTime = new Date(aiInsights.timestamp);
    const diffSeconds = Math.floor((now - analysisTime) / 1000);
    
    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  };

  return (
    <WebSocketContext.Provider value={{ 
      // Core metrics
      metrics, 
      connected, 
      loading,
      lastUpdate,
      pollCount,
      refreshMetrics,
      getLastUpdateText,
      
      // AI Analysis features (manual only)
      aiInsights,
      analyzing,
      aiEnabled,
      triggerManualAnalysis,
      clearAiInsights,
      getLastAnalysisText,
      
      // For compatibility with existing components
      requestMetrics: refreshMetrics,
      error: null, // No error state in polling mode
      sendRequest: refreshMetrics
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};