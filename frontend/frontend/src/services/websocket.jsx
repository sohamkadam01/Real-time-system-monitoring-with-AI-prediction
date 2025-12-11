import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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

  // Manual refresh function
  const refreshMetrics = () => {
    console.log('🔄 Manual refresh requested');
    setLoading(true);
    fetchMetrics();
  };

  // Initialize polling on component mount
  useEffect(() => {
    console.log('🚀 Starting polling system...');
    
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

  return (
    <WebSocketContext.Provider value={{ 
      metrics, 
      connected, 
      loading,
      lastUpdate,
      pollCount,
      refreshMetrics,
      getLastUpdateText,
      // For compatibility with existing components
      requestMetrics: refreshMetrics,
      error: null, // No error state in polling mode
      sendRequest: refreshMetrics
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};