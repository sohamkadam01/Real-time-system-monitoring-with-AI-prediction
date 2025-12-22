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
  Card,
  CardContent,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { useWebSocket } from '../services/websocket';
import { systemApi } from '../services/api';
import { formatPercentage, formatHertz } from '../utils/formatters';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';

const CpuMetrics = () => {
  const theme = useTheme();
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

  useEffect(() => {
    if (metrics?.cpu) {
      setCpuData(metrics.cpu);
      
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
          return newHistory.slice(-20);
        });
      }

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
          return newHistory.slice(-10);
        });
      }
    }
  }, [metrics]);

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
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          Loading CPU metrics...
        </Typography>
      </Box>
    );
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

  // Calculate average CPU usage from history
  const averageUsage = cpuHistory.length > 0 
    ? cpuHistory.reduce((sum, item) => sum + item.value, 0) / cpuHistory.length 
    : 0;

  // Find peak CPU usage from history
  const peakUsage = cpuHistory.length > 0
    ? Math.max(...cpuHistory.map(item => item.value))
    : 0;

  return (
    <Box>
      {/* Header Section */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <MemoryIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
            <Typography variant="h4" fontWeight="bold">
              CPU Metrics
            </Typography>
            <Chip 
              icon={metrics ? <TrendingUpIcon /> : <TimelineIcon />}
              label={metrics ? "Live Streaming" : "Polling"} 
              color={metrics ? "success" : "warning"}
              size="small"
              variant="outlined"
            />
          </Box>
          <Box display="flex" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Updated: {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
        
        {metrics && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.dark, 0.05)} 100%)`,
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              borderRadius: 1
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: theme.palette.success.main,
                animation: 'pulse 1.5s infinite',
              }} />
              <Typography variant="body2" fontWeight="medium">
                Real-time data streaming via WebSocket connection
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* CPU Overview Card */}
        <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                  <MemoryIcon fontSize="small" />
                  CPU Overview
                </Typography>
                <Chip 
                  label={cpuData.name || 'Unknown CPU'} 
                  color="primary" 
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="caption" color="text.secondary" display="block">
                      Physical Cores
                    </Typography>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {cpuData.physicalCores || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="caption" color="text.secondary" display="block">
                      Logical Cores
                    </Typography>
                    <Typography variant="h4" color="secondary" fontWeight="bold">
                      {cpuData.logicalCores || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="caption" color="text.secondary" display="block">
                      Current Frequency
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {cpuData.currentFrequency || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="caption" color="text.secondary" display="block">
                      Max Frequency
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {cpuData.maxFrequency || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Stats Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={3}>
                <AssessmentIcon fontSize="small" />
                Performance Stats
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Average Usage (History)
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                      variant="determinate"
                      value={averageUsage}
                      sx={{
                        flexGrow: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.info.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.info.main,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="body2" fontWeight="medium">
                      {formatPercentage(averageUsage)}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Peak Usage (History)
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                      variant="determinate"
                      value={peakUsage}
                      sx={{
                        flexGrow: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.error.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.error.main,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="body2" fontWeight="medium" color="error.main">
                      {formatPercentage(peakUsage)}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    History Entries
                  </Typography>
                  <Typography variant="h6">
                    {cpuHistory.length} / 20
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Current CPU Usage Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={3}>
                <SpeedIcon fontSize="small" />
                Current CPU Usage
              </Typography>
              
              {metrics?.dashboard?.cpuUsage !== undefined ? (
                <Box>
                  <Box mb={4}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      Overall Utilization
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.dashboard.cpuUsage}
                      sx={{
                        height: 24,
                        borderRadius: 12,
                        mb: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getCoreColor(metrics.dashboard.cpuUsage),
                          borderRadius: 12,
                          background: `linear-gradient(90deg, ${getCoreColor(metrics.dashboard.cpuUsage)} 0%, ${alpha(getCoreColor(metrics.dashboard.cpuUsage), 0.8)} 100%)`,
                        },
                      }}
                    />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        CPU Load
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {formatPercentage(metrics.dashboard.cpuUsage)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Load Averages
                  </Typography>
                  <Grid container spacing={2}>
                    {[1, 5, 15].map((minutes, index) => (
                      <Grid item xs={4} key={minutes}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            textAlign: 'center', 
                            p: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderColor: alpha(theme.palette.primary.main, 0.1),
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {minutes} Minute{minutes !== 1 ? 's' : ''}
                          </Typography>
                          <Typography variant="h4" fontWeight="bold" color="primary">
                            {cpuData.loadAverages?.[index]?.toFixed(2) || 'N/A'}
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">
                    Waiting for live data...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Per Core Usage Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={3}>
                <MemoryIcon fontSize="small" />
                Per Core Usage
              </Typography>
              
              {currentPerCoreUsage.length > 0 ? (
                <Grid container spacing={1.5}>
                  {currentPerCoreUsage.map((core) => (
                    <Grid item xs={6} sm={4} md={3} key={core.core}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          p: 1.5,
                          textAlign: 'center',
                          borderColor: alpha(getCoreColor(core.usage), 0.3),
                          borderRadius: 2,
                          '&:hover': {
                            borderColor: getCoreColor(core.usage),
                            bgcolor: alpha(getCoreColor(core.usage), 0.05),
                          }
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                          Core {core.core}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={core.usage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            my: 1.5,
                            backgroundColor: alpha(getCoreColor(core.usage), 0.2),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getCoreColor(core.usage),
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {formatPercentage(core.usage)}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">
                    No per-core data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* CPU Usage History Card */}
        <Grid item xs={12}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={3}>
                <HistoryIcon fontSize="small" />
                CPU Usage History
                <Chip 
                  label={`${cpuHistory.length} entries`} 
                  size="small" 
                  variant="outlined"
                  color="default"
                />
              </Typography>

              {cpuHistory.length > 0 ? (
                <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                  <TableContainer>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Time</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>CPU Usage</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>1 min Load</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>5 min Load</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>15 min Load</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cpuHistory.slice().reverse().map((item, index) => (
                          <TableRow 
                            key={index}
                            sx={{ 
                              '&:hover': { 
                                bgcolor: alpha(theme.palette.primary.main, 0.03) 
                              },
                              '&:last-child td, &:last-child th': { 
                                border: 0 
                              }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {new Date(item.time).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  second: '2-digit' 
                                })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Box sx={{ 
                                  flexGrow: 1, 
                                  height: 8, 
                                  backgroundColor: alpha(theme.palette.grey[300], 0.5),
                                  borderRadius: 4,
                                  overflow: 'hidden'
                                }}>
                                  <Box sx={{ 
                                    width: `${item.value}%`, 
                                    height: '100%',
                                    backgroundColor: getCoreColor(item.value),
                                    background: `linear-gradient(90deg, ${getCoreColor(item.value)} 0%, ${alpha(getCoreColor(item.value), 0.8)} 100%)`
                                  }} />
                                </Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 60 }}>
                                  {formatPercentage(item.value)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={item.load1m?.toFixed(2) || '0.00'} 
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  borderColor: alpha(theme.palette.info.main, 0.3)
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={item.load5m?.toFixed(2) || '0.00'} 
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                                  borderColor: alpha(theme.palette.warning.main, 0.3)
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={item.load15m?.toFixed(2) || '0.00'} 
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  borderColor: alpha(theme.palette.success.main, 0.3)
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={item.value >= 90 ? "High" : item.value >= 70 ? "Medium" : "Normal"} 
                                size="small"
                                color={item.value >= 90 ? "error" : item.value >= 70 ? "warning" : "success"}
                                variant="filled"
                                sx={{ 
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem'
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Box textAlign="center" py={6}>
                  <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No history data recorded yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Live data will start populating here
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* CPU Ticks Information Card */}
        <Grid item xs={12}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={3}>
                <AssessmentIcon fontSize="small" />
                CPU Tick Information
              </Typography>
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tick Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Value</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cpuData.cpuTicks && Object.entries(cpuData.cpuTicks).map(([key, value]) => {
                      const totalTicks = Object.values(cpuData.cpuTicks).reduce((a, b) => a + b, 0);
                      const percentage = totalTicks > 0 ? ((value / totalTicks) * 100).toFixed(2) : 0;
                      
                      return (
                        <TableRow 
                          key={key}
                          sx={{ 
                            '&:hover': { 
                              bgcolor: alpha(theme.palette.primary.main, 0.03) 
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {key}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {value?.toLocaleString() || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                              <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                  width: 100,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: theme.palette.primary.main,
                                    borderRadius: 3,
                                  },
                                }}
                              />
                              <Typography variant="body2" sx={{ minWidth: 50 }}>
                                {percentage}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CpuMetrics;