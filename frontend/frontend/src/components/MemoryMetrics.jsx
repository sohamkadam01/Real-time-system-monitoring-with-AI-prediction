import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import { useWebSocket } from '../services/websocket';
import { systemApi } from '../services/api';
import { formatBytes, formatPercentage } from '../utils/formatters';

const MemoryMetrics = () => {
  const { metrics } = useWebSocket();
  const [memoryData, setMemoryData] = useState(null);

  useEffect(() => {
    const fetchMemoryData = async () => {
      try {
        const response = await systemApi.getMemory();
        setMemoryData(response.data.memory);
      } catch (error) {
        console.error('Error fetching memory data:', error);
      }
    };

    fetchMemoryData();
    const interval = setInterval(fetchMemoryData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!memoryData) {
    return <Typography>Loading memory metrics...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Memory Metrics
      </Typography>
      
      <Grid container spacing={3}>
        {/* Main Memory */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Main Memory
            </Typography>
            
            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Usage: {formatPercentage(memoryData.usagePercentage)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatBytes(memoryData.used)} / {formatBytes(memoryData.total)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memoryData.usagePercentage}
                sx={{
                  height: 20,
                  borderRadius: 2,
                  backgroundColor: '#333',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: memoryData.usagePercentage >= 90 ? '#ff4444' :
                                   memoryData.usagePercentage >= 80 ? '#ffbb33' : '#00C851',
                  },
                }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="h6">
                    {formatBytes(memoryData.total)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
                  <Typography variant="body2" color="text.secondary">
                    Used
                  </Typography>
                  <Typography variant="h6">
                    {formatBytes(memoryData.used)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
                  <Typography variant="body2" color="text.secondary">
                    Available
                  </Typography>
                  <Typography variant="h6">
                    {formatBytes(memoryData.available)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Usage
                  </Typography>
                  <Typography variant="h6">
                    {formatPercentage(memoryData.usagePercentage)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Swap Memory */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Swap Memory
            </Typography>
            
            {memoryData.swapTotal > 0 ? (
              <>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Usage
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatBytes(memoryData.swapUsed)} / {formatBytes(memoryData.swapTotal)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(memoryData.swapUsed / memoryData.swapTotal) * 100}
                    sx={{
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: '#333',
                    }}
                  />
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Swap
                    </Typography>
                    <Typography variant="body1">
                      {formatBytes(memoryData.swapTotal)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Used Swap
                    </Typography>
                    <Typography variant="body1">
                      {formatBytes(memoryData.swapUsed)}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Typography color="text.secondary" align="center">
                No swap memory configured
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Memory Statistics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Memory Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Memory Utilization Over Time
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Box flex={1}>
                      <LinearProgress
                        variant="determinate"
                        value={memoryData.usagePercentage}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {formatPercentage(memoryData.usagePercentage)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Available Memory Ratio
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {(memoryData.available / memoryData.total * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MemoryMetrics;