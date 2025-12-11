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
} from '@mui/material';
import { systemApi } from '../services/api';
import { formatBytes, formatPercentage, getStatusColor } from '../utils/formatters';

const DiskMetrics = () => {
  const [disks, setDisks] = useState([]);

  useEffect(() => {
    const fetchDiskData = async () => {
      try {
        const response = await systemApi.getDisks();
        const disksData = response.data.disks || [];
        
        // Ensure all numeric fields are numbers
        const processedDisks = disksData.map(disk => ({
          ...disk,
          totalSpace: Number(disk.totalSpace) || 0,
          freeSpace: Number(disk.freeSpace) || 0,
          usedSpace: Number(disk.usedSpace) || 0,
          usagePercentage: Number(disk.usagePercentage) || 0,
        }));
        
        setDisks(processedDisks);
      } catch (error) {
        console.error('Error fetching disk data:', error);
      }
    };

    fetchDiskData();
    const interval = setInterval(fetchDiskData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (disks.length === 0) {
    return <Typography>Loading disk metrics...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Disk Metrics
      </Typography>
      
      <Grid container spacing={3}>
        {/* Disk Summary Cards */}
        {disks.slice(0, 4).map((disk, index) => (
          <Grid item xs={12} md={6} lg={3} key={index}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                  {disk.name || 'Unknown Disk'}
                </Typography>
                <Chip
                  label={disk.status || 'UNKNOWN'}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(disk.status),
                    color: 'white',
                  }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" noWrap>
                {disk.mountPoint || 'N/A'} ({disk.type || 'N/A'})
              </Typography>
              
              <Box mt={2} mb={1}>
                <LinearProgress
                  variant="determinate"
                  value={disk.usagePercentage || 0}
                  sx={{
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: '#333',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getStatusColor(disk.status),
                    },
                  }}
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {formatPercentage(disk.usagePercentage)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatBytes(disk.freeSpace)} free
                </Typography>
              </Box>
              
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(disk.usedSpace)} / {formatBytes(disk.totalSpace)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}

        {/* Detailed Disk Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              All Disks
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Mount Point</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Used</TableCell>
                    <TableCell align="right">Free</TableCell>
                    <TableCell align="right">Usage</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disks.map((disk, index) => (
                    <TableRow key={index}>
                      <TableCell>{disk.name || 'N/A'}</TableCell>
                      <TableCell>{disk.mountPoint || 'N/A'}</TableCell>
                      <TableCell>{disk.type || 'N/A'}</TableCell>
                      <TableCell align="right">{formatBytes(disk.totalSpace)}</TableCell>
                      <TableCell align="right">{formatBytes(disk.usedSpace)}</TableCell>
                      <TableCell align="right">{formatBytes(disk.freeSpace)}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center">
                          <Box flex={1} mr={2}>
                            <LinearProgress
                              variant="determinate"
                              value={disk.usagePercentage || 0}
                              sx={{
                                height: 8,
                                borderRadius: 1,
                                backgroundColor: '#333',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getStatusColor(disk.status),
                                },
                              }}
                            />
                          </Box>
                          {formatPercentage(disk.usagePercentage)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={disk.status || 'UNKNOWN'}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(disk.status),
                            color: 'white',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Disk Usage Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Disk Usage Distribution
            </Typography>
            <Grid container spacing={2}>
              {disks.map((disk, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      {disk.name || 'Unknown Disk'}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Used: {formatBytes(disk.usedSpace)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Free: {formatBytes(disk.freeSpace)}
                      </Typography>
                    </Box>
                    <Box display="flex" height="20px" borderRadius={1} overflow="hidden">
                      <Box
                        flex={`${disk.usagePercentage || 0}%`}
                        sx={{
                          backgroundColor: getStatusColor(disk.status),
                        }}
                      />
                      <Box
                        flex={`${100 - (disk.usagePercentage || 0)}%`}
                        sx={{
                          backgroundColor: '#333',
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DiskMetrics;