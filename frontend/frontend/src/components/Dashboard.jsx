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
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Thermostat as TempIcon,
  Speed as CpuIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useWebSocket } from '../services/websocket';
import { systemApi } from '../services/api';
import { formatPercentage, formatTemperature, getStatusColor } from '../utils/formatters';
import RealTimeChart from './RealTimeChart';
import ConnectionStatus from './ConnectionStatus'; // ADD THIS IMPORT

const Dashboard = () => {
  const { metrics, connected, loading, pollCount, refreshMetrics } = useWebSocket(); // ADD THESE
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Dashboard
        {connected && (
          <Chip 
            label={`Poll #${pollCount}`}
            size="small" 
            color="primary" 
            sx={{ ml: 2, verticalAlign: 'middle' }}
          />
        )}
      </Typography>
      
      {/* ADD CONNECTION STATUS COMPONENT */}
      <ConnectionStatus />
      
      {/* Manual Refresh Indicator */}
      {lastManualRefresh && (
        <Paper sx={{ p: 1, mb: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
          <Typography variant="body2" color="primary" align="center">
            ↻ Manually refreshed at {lastManualRefresh.toLocaleTimeString()}
          </Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Status Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <CpuIcon sx={{ mr: 1, color: getStatusColor(dashboardData.status) }} />
              <Typography variant="h6">System Status</Typography>
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
              {metrics?.dashboard?.cpuUsage !== undefined && (
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
          </Paper>
        </Grid>

        {/* Alerts Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <WarningIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Alerts</Typography>
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
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Updated every 3 seconds
            </Typography>
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
          </Paper>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Recent Alerts
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total: {alerts.length} alerts
              </Typography>
            </Box>
            {alerts.slice(0, 5).map((alert, index) => (
              <Card key={index} sx={{ 
                mb: 1, 
                backgroundColor: alert.level === 'CRITICAL' 
                  ? 'rgba(255, 68, 68, 0.1)' 
                  : 'rgba(255, 187, 51, 0.1)',
                borderLeft: `4px solid ${getStatusColor(alert.level === 'CRITICAL' ? 'CRITICAL' : 'WARNING')}`
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {alert.type}: {alert.message}
                      </Typography>
                      {alert.timestamp && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={alert.level}
                      size="small"
                      color={alert.level === 'CRITICAL' ? 'error' : 'warning'}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
            {alerts.length === 0 && (
              <Box textAlign="center" py={3}>
                <WarningIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">
                  No active alerts
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All systems operating normally
                </Typography>
              </Box>
            )}
            {alerts.length > 5 && (
              <Typography variant="caption" color="text.secondary" align="center" display="block" mt={1}>
                ... and {alerts.length - 5} more alerts
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;