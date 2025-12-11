import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useWebSocket } from '../services/websocket';
import { systemApi } from '../services/api';
import { formatPercentage, formatHertz } from '../utils/formatters';

const CpuMetrics = () => {
  const { metrics } = useWebSocket();
  const [cpuData, setCpuData] = useState(null);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [perCoreHistory, setPerCoreHistory] = useState([]);

  // Fetch initial data
  useEffect(() => {
    const fetchCpuData = async () => {
      try {
        const response = await systemApi.getCpu();
        setCpuData(response.data.cpu);
      } catch (error) {
        console.error('Error fetching CPU data:', error);
      }
    };

    fetchCpuData();
  }, []);

  // Update from WebSocket
  useEffect(() => {
    if (metrics?.cpu) {
      setCpuData(metrics.cpu);
      
      // Add to CPU usage history for chart
      const timestamp = new Date().getTime();
      if (metrics.dashboard?.cpuUsage !== undefined) {
        setCpuHistory(prev => {
          const newHistory = [...prev, { 
            time: timestamp, 
            value: metrics.dashboard.cpuUsage,
            load1m: metrics.cpu?.loadAverages?.[0] || 0,
            load5m: metrics.cpu?.loadAverages?.[1] || 0,
            load15m: metrics.cpu?.loadAverages?.[2] || 0
          }];
          return newHistory.slice(-20); // Keep last 20 points
        });
      }

      // Store per-core usage history
      if (metrics.cpu?.perCoreUsage) {
        setPerCoreHistory(prev => {
          const newEntry = {
            time: timestamp,
            cores: metrics.cpu.perCoreUsage.map((usage, i) => ({
              core: i + 1,
              usage: usage * 100
            }))
          };
          const newHistory = [...prev, newEntry];
          return newHistory.slice(-10); // Keep last 10 readings
        });
      }
    }
  }, [metrics]);

  // Fallback polling if WebSocket doesn't provide data
  useEffect(() => {
    if (!metrics) {
      const interval = setInterval(async () => {
        try {
          const response = await systemApi.getCpu();
          setCpuData(response.data.cpu);
        } catch (error) {
          console.error('Error polling CPU data:', error);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [metrics]);

  if (!cpuData) {
    return <Typography>Loading CPU metrics...</Typography>;
  }

  const getCoreColor = (usage) => {
    if (usage >= 90) return '#ff4444';
    if (usage >= 70) return '#ffbb33';
    return '#00C851';
  };

  // Get current per-core usage from history
  const currentPerCoreUsage = perCoreHistory.length > 0 
    ? perCoreHistory[perCoreHistory.length - 1].cores
    : cpuData.perCoreUsage?.map((usage, i) => ({
        core: i + 1,
        usage: (usage || 0) * 100
      })) || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        CPU Metrics {metrics ? '⚡' : '⏳'}
      </Typography>
      
      {/* Live Status Indicator */}
      {metrics && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
          <Box display="flex" alignItems="center">
            <Box sx={{ 
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              backgroundColor: '#4caf50',
              animation: 'pulse 1s infinite',
              mr: 2 
            }} />
            <Typography variant="body2">
              Live data updating via WebSocket
            </Typography>
          </Box>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* CPU Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                CPU Overview
              </Typography>
              <Chip 
                label="Live" 
                color="success" 
                size="small"
                variant={metrics ? "filled" : "outlined"}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{cpuData.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="body2" color="text.secondary">
                  Physical Cores
                </Typography>
                <Typography variant="body1">{cpuData.physicalCores || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="body2" color="text.secondary">
                  Logical Cores
                </Typography>
                <Typography variant="body1">{cpuData.logicalCores || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="body2" color="text.secondary">
                  Current Frequency
                </Typography>
                <Typography variant="body1">{cpuData.currentFrequency || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="body2" color="text.secondary">
                  Max Frequency
                </Typography>
                <Typography variant="body1">{cpuData.maxFrequency || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Live CPU Usage & Load Averages */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Live CPU Usage
            </Typography>
            <Box mb={3}>
              {metrics?.dashboard?.cpuUsage !== undefined ? (
                <>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.dashboard.cpuUsage}
                    sx={{
                      height: 20,
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: '#333',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getCoreColor(metrics.dashboard.cpuUsage),
                      },
                    }}
                  />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Current Usage
                    </Typography>
                    <Typography variant="h5">
                      {formatPercentage(metrics.dashboard.cpuUsage)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">Waiting for data...</Typography>
              )}
            </Box>
            
            <Typography variant="h6" gutterBottom>
              Load Averages
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                  <Typography variant="body2" color="text.secondary">
                    1 Minute
                  </Typography>
                  <Typography variant="h5">
                    {cpuData.loadAverages?.[0]?.toFixed(2) || 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                  <Typography variant="body2" color="text.secondary">
                    5 Minutes
                  </Typography>
                  <Typography variant="h5">
                    {cpuData.loadAverages?.[1]?.toFixed(2) || 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                  <Typography variant="body2" color="text.secondary">
                    15 Minutes
                  </Typography>
                  <Typography variant="h5">
                    {cpuData.loadAverages?.[2]?.toFixed(2) || 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Per Core Usage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Per Core Usage (Live)
            </Typography>
            <Grid container spacing={1}>
              {currentPerCoreUsage.map((core) => (
                <Grid item xs={6} sm={4} md={3} key={core.core}>
                  <Box sx={{ p: 1, border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Core {core.core}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={core.usage}
                      sx={{
                        height: 6,
                        borderRadius: 1,
                        my: 1,
                        backgroundColor: '#333',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getCoreColor(core.usage),
                        },
                      }}
                    />
                    <Typography variant="caption" align="center" display="block">
                      {formatPercentage(core.usage)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            {currentPerCoreUsage.length === 0 && (
              <Typography color="text.secondary" align="center" py={2}>
                No per-core data available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* CPU Usage History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              CPU Usage History (Last {cpuHistory.length} readings)
            </Typography>
            <Box sx={{ height: 200, overflow: 'auto' }}>
              <Grid container spacing={1}>
                {cpuHistory.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                    <Box sx={{ 
                      p: 1, 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit' 
                        })}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={0.5}>
                        <Box sx={{ 
                          width: '100%', 
                          height: 8, 
                          backgroundColor: '#333',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${item.value}%`, 
                            height: '100%',
                            backgroundColor: getCoreColor(item.value)
                          }} />
                        </Box>
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          {formatPercentage(item.value)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              {cpuHistory.length === 0 && (
                <Typography color="text.secondary" align="center" py={4}>
                  No history data yet
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* CPU Ticks */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              CPU Tick Information
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tick Type</TableCell>
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cpuData.cpuTicks && Object.entries(cpuData.cpuTicks).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell align="right">{value?.toLocaleString() || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CpuMetrics;