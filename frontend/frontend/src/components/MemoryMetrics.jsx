import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Tooltip,
  Chip,
  ButtonGroup,
  Button,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useWebSocket } from '../services/websocket';
import { systemApi } from '../services/api';
import { formatBytes, formatPercentage } from '../utils/formatters';

const MemoryMetrics = () => {
  const theme = useTheme();
  const { metrics, isConnected } = useWebSocket();
  const [memoryData, setMemoryData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'compact'
  const [timeRange, setTimeRange] = useState('realtime'); // 'realtime', '1h', '6h', '24h'
  const [memoryHistory, setMemoryHistory] = useState([]);

  const fetchMemoryData = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const response = await systemApi.getMemory();
      const newData = response.data.memory;
      setMemoryData(newData);
      
      // Maintain history for visualization
      setMemoryHistory(prev => {
        const updated = [...prev, {
          timestamp: new Date(),
          usage: newData.usagePercentage,
          used: newData.used,
          available: newData.available
        }].slice(-60); // Keep last 60 data points
        return updated;
      });
      
    } catch (error) {
      console.error('Error fetching memory data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchMemoryData();
    const interval = setInterval(fetchMemoryData, 3000);
    return () => clearInterval(interval);
  }, [fetchMemoryData]);

  // Update from WebSocket if available
  useEffect(() => {
    if (metrics?.memory) {
      setMemoryData(prev => ({
        ...prev,
        ...metrics.memory,
        usagePercentage: metrics.memory.usagePercentage || 
          ((metrics.memory.used / metrics.memory.total) * 100)
      }));
    }
  }, [metrics]);

  const getMemoryStatusColor = (percentage) => {
    if (percentage >= 90) return theme.palette.error.main;
    if (percentage >= 75) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getMemoryStatusText = (percentage) => {
    if (percentage >= 90) return 'Critical';
    if (percentage >= 75) return 'Warning';
    if (percentage >= 50) return 'Normal';
    return 'Good';
  };

  const handleManualRefresh = () => {
    fetchMemoryData();
  };

  if (!memoryData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading memory metrics...</Typography>
      </Box>
    );
  }

  const MemoryUsageGauge = ({ percentage, label, size = 'medium' }) => {
    const sizePx = size === 'large' ? 200 : size === 'medium' ? 120 : 80;
    const strokeWidth = size === 'large' ? 12 : 8;
    const radius = (sizePx - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (percentage / 100) * circumference;
    
    return (
      <Box position="relative" display="inline-flex" flexDirection="column" alignItems="center">
        <svg width={sizePx} height={sizePx}>
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={radius}
            fill="none"
            stroke={theme.palette.grey[800]}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={radius}
            fill="none"
            stroke={getMemoryStatusColor(percentage)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform={`rotate(-90 ${sizePx / 2} ${sizePx / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          sx={{ transform: 'translate(-50%, -50%)' }}
          textAlign="center"
        >
          <Typography variant={size === 'large' ? 'h4' : size === 'medium' ? 'h5' : 'h6'}>
            {formatPercentage(percentage)}
          </Typography>
          {label && (
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <MemoryIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
          <Box>
            <Typography variant="h4" gutterBottom={false}>
              Memory Metrics
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip 
                label={getMemoryStatusText(memoryData.usagePercentage)} 
                size="small"
                sx={{ 
                  backgroundColor: getMemoryStatusColor(memoryData.usagePercentage) + '20',
                  color: getMemoryStatusColor(memoryData.usagePercentage)
                }}
              />
              <Tooltip title="WebSocket Connection Status">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isConnected ? theme.palette.success.main : theme.palette.error.main,
                  }}
                />
              </Tooltip>
            </Box>
          </Box>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center">
          <ButtonGroup size="small" variant="outlined">
            <Button 
              onClick={() => setViewMode('compact')}
              variant={viewMode === 'compact' ? 'contained' : 'outlined'}
            >
              Compact
            </Button>
            <Button 
              onClick={() => setViewMode('detailed')}
              variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
            >
              Detailed
            </Button>
          </ButtonGroup>
          
          <Tooltip title="Refresh manually">
            <IconButton 
              onClick={handleManualRefresh} 
              disabled={isRefreshing}
              size="small"
            >
              <RefreshIcon sx={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {viewMode === 'compact' ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Memory Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatBytes(memoryData.used)} / {formatBytes(memoryData.total)} used
                </Typography>
              </Box>
              <MemoryUsageGauge percentage={memoryData.usagePercentage} size="small" />
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {/* Memory Overview Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <MemoryUsageGauge 
                    percentage={memoryData.usagePercentage} 
                    label="Memory Usage"
                    size="large"
                  />
                  
                  <Box textAlign="center" width="100%">
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Memory Status
                    </Typography>
                    <Chip 
                      icon={memoryData.usagePercentage >= 90 ? <WarningIcon /> : <InfoIcon />}
                      label={getMemoryStatusText(memoryData.usagePercentage)}
                      sx={{ 
                        backgroundColor: getMemoryStatusColor(memoryData.usagePercentage) + '20',
                        color: getMemoryStatusColor(memoryData.usagePercentage),
                        fontSize: '0.9rem',
                        padding: 1
                      }}
                    />
                  </Box>
                  
                  <Box width="100%" mt={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Live Metrics
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption">Used:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatBytes(memoryData.used)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">Available:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatBytes(memoryData.available)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">Total:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatBytes(memoryData.total)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">Free:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatBytes(memoryData.free || memoryData.total - memoryData.used)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Memory Breakdown */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <TimelineIcon fontSize="small" />
                Memory Breakdown
              </Typography>
              
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Memory Utilization
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatPercentage(memoryData.usagePercentage)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={memoryData.usagePercentage}
                  sx={{
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: theme.palette.grey[800],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getMemoryStatusColor(memoryData.usagePercentage),
                      transition: 'transform 0.5s ease',
                    },
                  }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    0%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    100%
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {[
                  { label: 'Total Memory', value: memoryData.total, color: theme.palette.info.main, icon: <StorageIcon /> },
                  { label: 'Used Memory', value: memoryData.used, color: theme.palette.error.main, icon: <MemoryIcon /> },
                  { label: 'Available Memory', value: memoryData.available, color: theme.palette.success.main, icon: <StorageIcon /> },
                  { label: 'Cache/Buffer', value: memoryData.cached || 0, color: theme.palette.warning.main, icon: <MemoryIcon /> },
                ].map((item, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <Paper sx={{ 
                      p: 2, 
                      backgroundColor: item.color + '10',
                      borderLeft: `4px solid ${item.color}`,
                      height: '100%'
                    }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Box sx={{ color: item.color }}>
                          {item.icon}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {item.label}
                        </Typography>
                      </Box>
                      <Typography variant="h6">
                        {formatBytes(item.value)}
                      </Typography>
                      {item.label !== 'Total Memory' && (
                        <Typography variant="caption" color="text.secondary">
                          {((item.value / memoryData.total) * 100).toFixed(1)}%
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Swap Memory Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <StorageIcon fontSize="small" />
                Swap Memory
              </Typography>
              
              {memoryData.swapTotal > 0 ? (
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Swap Usage
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatPercentage((memoryData.swapUsed / memoryData.swapTotal) * 100)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(memoryData.swapUsed / memoryData.swapTotal) * 100}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: theme.palette.grey[800],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette.secondary.main,
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" mt={0.5}>
                        {formatBytes(memoryData.swapUsed)} / {formatBytes(memoryData.swapTotal)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Swap Free
                        </Typography>
                        <Typography variant="h6">
                          {formatBytes(memoryData.swapFree || memoryData.swapTotal - memoryData.swapUsed)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Swap Utilization
                        </Typography>
                        <Typography variant="h6">
                          {((memoryData.swapUsed / memoryData.swapTotal) * 100).toFixed(1)}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              ) : (
                <Box textAlign="center" py={4}>
                  <StorageIcon sx={{ fontSize: 48, color: theme.palette.grey[500], mb: 2 }} />
                  <Typography color="text.secondary">
                    No swap memory configured
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Swap is not enabled on this system
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* History Visualization */}
      {viewMode === 'detailed' && memoryHistory.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Usage History
          </Typography>
          <Box sx={{ height: 100, display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
            {memoryHistory.map((point, index) => (
              <Tooltip 
                key={index} 
                title={`${point.usage.toFixed(1)}% at ${point.timestamp.toLocaleTimeString()}`}
              >
                <Box
                  sx={{
                    flex: 1,
                    height: `${point.usage}%`,
                    backgroundColor: getMemoryStatusColor(point.usage),
                    opacity: 0.7,
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s ease',
                    '&:hover': {
                      opacity: 1,
                      transform: 'scaleY(1.05)',
                    },
                  }}
                />
              </Tooltip>
            ))}
          </Box>
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption" color="text.secondary">
              {memoryHistory[0]?.timestamp.toLocaleTimeString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default MemoryMetrics;