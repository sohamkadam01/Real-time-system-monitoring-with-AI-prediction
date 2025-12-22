import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Thermostat as TempIcon,
  Speed as CpuIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  Psychology as PsychologyIcon,
  Refresh as RefreshIcon,
  Insights as InsightsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useWebSocket } from '../services/websocket';
import { systemApi } from '../services/api';
import { formatPercentage, formatTemperature, getStatusColor } from '../utils/formatters';
import RealTimeChart from './RealTimeChart';
import ConnectionStatus from './ConnectionStatus';
import AiInsights from './AiInsights';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

const Dashboard = () => {
  const { 
    metrics, 
    connected, 
    loading, 
    pollCount, 
    refreshMetrics,
    aiInsights,
    analyzing,
    aiEnabled,
    triggerManualAnalysis,
    getLastAnalysisText
  } = useWebSocket();
  
  const { user } = useAuth(); // Get user from auth context
  
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memoryHistory, setMemoryHistory] = useState([]);
  const [lastManualRefresh, setLastManualRefresh] = useState(null);

  // Use WebSocket data if available, otherwise fetch via API
  useEffect(() => {
    if (metrics?.dashboard) {
      // Use data from WebSocket context
      setDashboardData(metrics.dashboard);
      setAlerts(metrics.alerts || []);
    } else {
      // Fallback to API fetch
      const fetchDashboard = async () => {
        try {
          const response = await systemApi.getDashboard();
          setDashboardData(response.data.dashboard);
          setAlerts(response.data.alerts || []);
        } catch (error) {
          console.error('Error fetching dashboard:', error);
        }
      };
      fetchDashboard();
    }
  }, [metrics]);

  // Update history charts from WebSocket data
  useEffect(() => {
    if (metrics?.dashboard) {
      const timestamp = new Date().getTime();
      setCpuHistory(prev => {
        const newHistory = [...prev, { 
          time: timestamp, 
          value: metrics.dashboard.cpuUsage,
          label: `Poll #${pollCount}`
        }];
        return newHistory.slice(-20); // Keep last 20 points
      });
      setMemoryHistory(prev => {
        const newHistory = [...prev, { 
          time: timestamp, 
          value: metrics.dashboard.memoryUsage,
          label: `Poll #${pollCount}`
        }];
        return newHistory.slice(-20);
      });
    }
  }, [metrics, pollCount]);

  // Handle manual refresh
  const handleManualRefresh = () => {
    setLastManualRefresh(new Date());
    refreshMetrics();
  };

  // Handle manual AI analysis
  const handleManualAIAnalysis = () => {
    triggerManualAnalysis();
  };

  if (!dashboardData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6" color="text.secondary">
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  const criticalAlerts = alerts.filter(alert => alert.level === 'CRITICAL').length;
  const warningAlerts = alerts.filter(alert => alert.level === 'WARNING').length;

  // Calculate AI health score for display
  const aiHealthScore = aiInsights?.healthScore || 0;
  const aiHealthColor = aiHealthScore >= 8 ? '#4caf50' : aiHealthScore >= 6 ? '#ff9800' : '#f44336';

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return user.username || user.name || user.email?.split('@')[0] || 'User';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'G';
    const name = user.username || user.name || '';
    return name.charAt(0).toUpperCase();
  };

  return (
    <Box>
      {/* Header with User Welcome and AI Status */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          {/* User Welcome Section */}
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              {getUserInitials()}
            </Avatar>
            <Box>
              <Typography variant="h6" component="div" sx={{ lineHeight: 1 }}>
                Welcome back, {getUserDisplayName()}!
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                {user?.systemname ? `Monitoring: ${user.systemname}` : 'System Monitoring Dashboard'}
              </Typography>
            </Box>
          </Box>
          
          {connected && (
            <Chip 
              label={`Poll #${pollCount}`}
              size="small" 
              color="primary" 
              sx={{ verticalAlign: 'middle' }}
            />
          )}
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          {/* AI Health Score Indicator */}
          {aiInsights?.healthScore && (
            <Tooltip title={`AI Health Score: ${aiHealthScore}/10`}>
              <Paper sx={{ 
                p: 1, 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                border: `1px solid ${aiHealthColor}`
              }}>
                <PsychologyIcon sx={{ mr: 0.5, color: aiHealthColor, fontSize: 18 }} />
                <Typography variant="body2" fontWeight="bold" color={aiHealthColor}>
                  {aiHealthScore}/10
                </Typography>
              </Paper>
            </Tooltip>
          )}
          
          {/* Manual AI Analysis Button */}
          <Tooltip title="Run AI Analysis">
            <IconButton 
              size="small" 
              onClick={handleManualAIAnalysis}
              disabled={analyzing || !aiEnabled}
              color="primary"
              sx={{ 
                backgroundColor: aiEnabled ? 'rgba(103, 58, 183, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                '&:hover': {
                  backgroundColor: aiEnabled ? 'rgba(103, 58, 183, 0.2)' : 'rgba(158, 158, 158, 0.2)'
                }
              }}
            >
              <InsightsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Manual Refresh Button */}
          <Tooltip title="Refresh Metrics">
            <IconButton 
              size="small" 
              onClick={handleManualRefresh}
              disabled={loading}
              color="primary"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Connection Status */}
      <ConnectionStatus />
      
      {/* AI Insights Component */}
      <AiInsights />
      
      {/* Manual Refresh Indicator */}
      {lastManualRefresh && (
        <Paper sx={{ p: 1, mb: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
          <Typography variant="body2" color="primary" align="center">
            ↻ Manually refreshed at {lastManualRefresh.toLocaleTimeString()}
          </Typography>
        </Paper>
      )}

      {/* User Info Card (Optional - can remove if you want less prominent display) */}
      {user && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
           
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* System Metrics Grid */}
      <Grid container spacing={3}>
        {/* Status Summary with AI Integration */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <CpuIcon sx={{ mr: 1, color: getStatusColor(dashboardData.status) }} />
                <Typography variant="h6">System Status</Typography>
              </Box>
              {aiInsights?.summary && (
                <Tooltip title="AI Summary">
                  <PsychologyIcon sx={{ color: '#673ab7', fontSize: 18 }} />
                </Tooltip>
              )}
            </Box>
            <Chip
              label={dashboardData.status}
              sx={{
                backgroundColor: getStatusColor(dashboardData.status),
                color: 'white',
                fontWeight: 'bold',
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Running Processes: {dashboardData.runningProcesses}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Uptime: {dashboardData.systemUptime}
            </Typography>
            {aiInsights?.summary && (
              <Box mt={1} pt={1} borderTop="1px solid rgba(255, 255, 255, 0.1)">
                <Typography variant="caption" color="#673ab7" fontWeight="medium">
                  AI: {aiInsights.summary}
                </Typography>
              </Box>
            )}
            {loading && (
              <LinearProgress sx={{ mt: 1, height: 2 }} />
            )}
          </Paper>
        </Grid>

        {/* CPU Usage */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <CpuIcon sx={{ mr: 1 }} />
                <Typography variant="h6">CPU Usage</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {metrics?.dashboard?.cpuUsage !== undefined && (
                  <Chip 
                    label="Live" 
                    size="small" 
                    color="success" 
                    variant="outlined"
                  />
                )}
                {analyzing && (
                  <PsychologyIcon sx={{ fontSize: 16, color: '#673ab7', animation: 'pulse 1s infinite' }} />
                )}
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={dashboardData.cpuUsage}
              sx={{
                height: 10,
                borderRadius: 5,
                mb: 1,
                backgroundColor: '#333',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getStatusColor(
                    dashboardData.cpuUsage >= 90 ? 'CRITICAL' :
                    dashboardData.cpuUsage >= 70 ? 'WARNING' : 'HEALTHY'
                  ),
                },
              }}
            />
            <Typography variant="h4">{formatPercentage(dashboardData.cpuUsage)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {metrics ? 'Live data' : 'Polled data'}
            </Typography>
            {/* AI CPU Insights */}
            {aiInsights?.bottlenecks?.some(b => b.toLowerCase().includes('cpu')) && (
              <Box mt={1}>
                <Typography variant="caption" color="warning.main">
                  ⚠️ AI detected CPU bottleneck
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <MemoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Memory Usage</Typography>
              </Box>
              {metrics?.dashboard?.memoryUsage !== undefined && (
                <Chip 
                  label="Live" 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={dashboardData.memoryUsage}
              sx={{
                height: 10,
                borderRadius: 5,
                mb: 1,
                backgroundColor: '#333',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getStatusColor(
                    dashboardData.memoryUsage >= 90 ? 'CRITICAL' :
                    dashboardData.memoryUsage >= 80 ? 'WARNING' : 'HEALTHY'
                  ),
                },
              }}
            />
            <Typography variant="h4">{formatPercentage(dashboardData.memoryUsage)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {metrics ? 'Live data' : 'Polled data'}
            </Typography>
            {/* AI Memory Insights */}
            {aiInsights?.bottlenecks?.some(b => b.toLowerCase().includes('memory')) && (
              <Box mt={1}>
                <Typography variant="caption" color="warning.main">
                  ⚠️ AI detected memory bottleneck
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Temperature */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <TempIcon sx={{ mr: 1 }} />
              <Typography variant="h6">CPU Temperature</Typography>
            </Box>
            <Typography variant="h4">{formatTemperature(dashboardData.cpuTemperature)}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {dashboardData.cpuTemperature >= 80 ? 'Critical' :
               dashboardData.cpuTemperature >= 70 ? 'Warning' : 'Normal'}
            </Typography>
            {dashboardData.cpuTemperature <= 0 && (
              <Typography variant="caption" color="text.secondary">
                Sensor not available
              </Typography>
            )}
            {/* AI Temperature Insights */}
            {aiInsights?.predictions?.some(p => p.toLowerCase().includes('temperature') || p.toLowerCase().includes('overheat')) && (
              <Box mt={1}>
                <Typography variant="caption" color="error.main">
                  🔥 AI predicts overheating risk
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Alerts Summary with AI Predictions */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <WarningIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Alerts</Typography>
              </Box>
              {aiInsights?.predictions && aiInsights.predictions.length > 0 && (
                <Tooltip title={`${aiInsights.predictions.length} AI Predictions`}>
                  <PsychologyIcon sx={{ color: '#673ab7', fontSize: 18 }} />
                </Tooltip>
              )}
            </Box>
            <Box display="flex" flexDirection="column" gap={1}>
              <Chip
                label={`${criticalAlerts} Critical`}
                color="error"
                size="small"
              />
              <Chip
                label={`${warningAlerts} Warnings`}
                color="warning"
                size="small"
              />
              {aiInsights?.predictions && aiInsights.predictions.length > 0 && (
                <Chip
                  label={`${aiInsights.predictions.length} AI Predictions`}
                  color="secondary"
                  size="small"
                  icon={<PsychologyIcon />}
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Updated every 3 seconds
            </Typography>
            {/* Last AI Analysis Time */}
            {aiInsights?.timestamp && (
              <Typography variant="caption" color="#673ab7" sx={{ mt: 1, display: 'block' }}>
                AI: {getLastAnalysisText()}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Real-time Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">
                CPU Usage History
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {cpuHistory.length} data points
              </Typography>
            </Box>
            <RealTimeChart data={cpuHistory} dataKey="value" color="#2196f3" unit="%" />
            <Typography variant="caption" color="text.secondary" align="center">
              Last 20 polls ({Math.round(cpuHistory.length * 3 / 60)} minutes)
            </Typography>
            {/* AI CPU Trend */}
            {aiInsights?.predictions?.some(p => p.toLowerCase().includes('cpu trend')) && (
              <Typography variant="caption" color="#2196f3" align="center" display="block" mt={0.5}>
                🧠 AI: Monitoring CPU trend
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">
                Memory Usage History
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {memoryHistory.length} data points
              </Typography>
            </Box>
            <RealTimeChart data={memoryHistory} dataKey="value" color="#4caf50" unit="%" />
            <Typography variant="caption" color="text.secondary" align="center">
              Last 20 polls ({Math.round(memoryHistory.length * 3 / 60)} minutes)
            </Typography>
            {/* AI Memory Trend */}
            {aiInsights?.predictions?.some(p => p.toLowerCase().includes('memory trend')) && (
              <Typography variant="caption" color="#4caf50" align="center" display="block" mt={0.5}>
                🧠 AI: Monitoring memory trend
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Alerts with AI Predictions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Recent Alerts & AI Predictions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total: {alerts.length} alerts
              </Typography>
            </Box>
            
            {/* Combine System Alerts and AI Predictions */}
            {[...alerts, ...(aiInsights?.predictions?.map((pred, index) => ({
              id: `ai-pred-${index}`,
              type: 'AI_PREDICTION',
              level: 'INFO',
              message: pred,
              timestamp: new Date().getTime(),
              source: 'ai'
            })) || [])]
              .slice(0, 8)
              .map((alert, index) => (
                <Card key={alert.id || index} sx={{ 
                  mb: 1, 
                  backgroundColor: alert.source === 'ai' 
                    ? 'rgba(103, 58, 183, 0.1)' 
                    : alert.level === 'CRITICAL' 
                      ? 'rgba(255, 68, 68, 0.1)' 
                      : 'rgba(255, 187, 51, 0.1)',
                  borderLeft: `4px solid ${
                    alert.source === 'ai' ? '#673ab7' :
                    alert.level === 'CRITICAL' ? '#f44336' : '#ff9800'
                  }`
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          {alert.source === 'ai' && <PsychologyIcon sx={{ fontSize: 16, color: '#673ab7' }} />}
                          <Typography variant="body1" fontWeight="medium">
                            {alert.type}: {alert.message}
                          </Typography>
                        </Box>
                        {alert.timestamp && (
                          <Typography variant="caption" color="text.secondary">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={alert.source === 'ai' ? 'AI Prediction' : alert.level}
                        size="small"
                        color={alert.source === 'ai' ? 'secondary' : alert.level === 'CRITICAL' ? 'error' : 'warning'}
                        icon={alert.source === 'ai' ? <PsychologyIcon /> : undefined}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            
            {alerts.length === 0 && (!aiInsights?.predictions || aiInsights.predictions.length === 0) && (
              <Box textAlign="center" py={3}>
                <WarningIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">
                  No active alerts or predictions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All systems operating normally
                </Typography>
              </Box>
            )}
            
            {(alerts.length > 8 || (aiInsights?.predictions && aiInsights.predictions.length > 4)) && (
              <Typography variant="caption" color="text.secondary" align="center" display="block" mt={1}>
                ... showing 8 most recent items
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Add CSS animation for AI icon */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default Dashboard;