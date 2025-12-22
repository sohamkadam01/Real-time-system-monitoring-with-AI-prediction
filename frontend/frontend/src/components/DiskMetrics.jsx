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
  alpha,
  IconButton,
  Tooltip,
  CircularProgress,
  Fade
} from '@mui/material';
import { systemApi } from '../services/api';
import { formatBytes, formatPercentage, getStatusColor } from '../utils/formatters';
import StorageIcon from '@mui/icons-material/Storage';
import FolderIcon from '@mui/icons-material/Folder';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';

const DiskMetrics = () => {
  const theme = useTheme();
  const [disks, setDisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDiskData = async () => {
    try {
      setRefreshing(true);
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
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching disk data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiskData();
    const interval = setInterval(fetchDiskData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && disks.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <CircularProgress size={60} thickness={4} sx={{ mb: 3, color: theme.palette.primary.main }} />
        <Typography variant="h6" color="text.secondary">
          Loading disk metrics...
        </Typography>
      </Box>
    );
  }

  // Calculate total disk stats
  const totalStats = disks.reduce((acc, disk) => ({
    totalSpace: acc.totalSpace + disk.totalSpace,
    usedSpace: acc.usedSpace + disk.usedSpace,
    freeSpace: acc.freeSpace + disk.freeSpace,
  }), { totalSpace: 0, usedSpace: 0, freeSpace: 0 });

  const totalUsagePercentage = totalStats.totalSpace > 0 
    ? (totalStats.usedSpace / totalStats.totalSpace) * 100 
    : 0;

  return (
    <Fade in={true} timeout={800}>
      <Box>
        {/* Header Section */}
        <Box mb={4}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <StorageIcon sx={{ 
                fontSize: 36, 
                color: theme.palette.primary.main,
                animation: 'pulse 2s infinite'
              }} />
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5
                }}>
                  Disk Metrics
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time disk usage and performance monitoring
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={<DataUsageIcon />}
                label={`${disks.length} Disk${disks.length !== 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
              />
              <IconButton 
                onClick={fetchDiskData} 
                disabled={refreshing}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'rotate(360deg)',
                    transition: 'transform 0.6s'
                  }
                }}
              >
                <RefreshIcon 
                  sx={{ 
                    color: theme.palette.primary.main,
                    animation: refreshing ? 'spin 1s linear infinite' : 'none'
                  }} 
                />
              </IconButton>
            </Box>
          </Box>

          {/* Total Usage Card */}
          <Card sx={{ 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
            color: 'white',
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
            overflow: 'visible',
            mb: 2
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Total Storage Overview
                  </Typography>
                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Total Capacity
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatBytes(totalStats.totalSpace)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Used Space
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatBytes(totalStats.usedSpace)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Free Space
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatBytes(totalStats.freeSpace)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                <Box position="relative" width={120} height={120}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={120}
                    thickness={4}
                    sx={{ color: alpha('#fff', 0.2) }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={totalUsagePercentage}
                    size={120}
                    thickness={4}
                    sx={{
                      color: '#fff',
                      position: 'absolute',
                      left: 0,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      }
                    }}
                  />
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    sx={{ transform: 'translate(-50%, -50%)' }}
                  >
                    <Typography variant="h4" fontWeight="bold">
                      {formatPercentage(totalUsagePercentage)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Grid container spacing={3}>
          {/* Disk Summary Cards with Glass Effect */}
          {disks.slice(0, 4).map((disk, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <Card sx={{
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 48px ${alpha(getStatusColor(disk.status), 0.2)}`,
                  borderColor: alpha(getStatusColor(disk.status), 0.3),
                }
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <StorageIcon fontSize="small" sx={{ color: getStatusColor(disk.status) }} />
                      <Typography variant="h6" noWrap fontWeight="bold" sx={{ maxWidth: '70%' }}>
                        {disk.name || 'Unknown Disk'}
                      </Typography>
                    </Box>
                    <Chip
                      label={disk.status || 'UNKNOWN'}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(disk.status),
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: `0 2px 8px ${alpha(getStatusColor(disk.status), 0.4)}`
                      }}
                    />
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <FolderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {disk.mountPoint || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Animated Progress Bar */}
                  <Box position="relative" mb={3}>
                    <LinearProgress
                      variant="determinate"
                      value={disk.usagePercentage || 0}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: alpha(getStatusColor(disk.status), 0.2),
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(90deg, ${getStatusColor(disk.status)} 0%, ${alpha(getStatusColor(disk.status), 0.8)} 100%)`,
                          borderRadius: 6,
                          animation: 'pulse 2s infinite',
                        },
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        position: 'absolute', 
                        right: 0, 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        backgroundColor: alpha(theme.palette.background.paper, 0.9),
                        px: 1,
                        borderRadius: 1,
                        fontWeight: 'bold'
                      }}
                    >
                      {formatPercentage(disk.usagePercentage)}
                    </Typography>
                  </Box>
                  
                  {/* Space Details */}
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Used
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatBytes(disk.usedSpace)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Free
                      </Typography>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {formatBytes(disk.freeSpace)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Total
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatBytes(disk.totalSpace)}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Type Badge */}
                  <Box mt={2}>
                    <Chip
                      icon={<SpeedIcon fontSize="small" />}
                      label={disk.type || 'N/A'}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: 'text.secondary'
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Detailed Disk Table with Enhanced Design */}
          <Grid item xs={12}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                p: 3, 
                background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
              }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                    <DonutLargeIcon />
                    Disk Details Table
                  </Typography>
                  <Tooltip title="Last updated">
                    <Typography variant="caption" color="text.secondary">
                      {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
                    </Typography>
                  </Tooltip>
                </Box>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      backgroundColor: alpha(theme.palette.primary.main, 0.04)
                    }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Disk Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Mount Point</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Used</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Free</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Usage</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {disks.map((disk, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: alpha(theme.palette.primary.main, 0.03),
                            transform: 'scale(1.002)',
                            transition: 'all 0.2s'
                          }
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <StorageIcon fontSize="small" sx={{ color: getStatusColor(disk.status) }} />
                            <Typography variant="body2" fontWeight="medium">
                              {disk.name || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <FolderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {disk.mountPoint || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={disk.type || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {formatBytes(disk.totalSpace)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2 }}>
                          <Typography variant="body2" color="error.main">
                            {formatBytes(disk.usedSpace)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2 }}>
                          <Typography variant="body2" color="success.main">
                            {formatBytes(disk.freeSpace)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box flex={1}>
                              <LinearProgress
                                variant="determinate"
                                value={disk.usagePercentage || 0}
                                sx={{
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor: alpha(getStatusColor(disk.status), 0.2),
                                  '& .MuiLinearProgress-bar': {
                                    background: `linear-gradient(90deg, ${getStatusColor(disk.status)} 0%, ${alpha(getStatusColor(disk.status), 0.8)} 100%)`,
                                    borderRadius: 5,
                                  },
                                }}
                              />
                            </Box>
                            <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 60 }}>
                              {formatPercentage(disk.usagePercentage)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={disk.status || 'UNKNOWN'}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(disk.status),
                              color: 'white',
                              fontWeight: 'bold',
                              boxShadow: `0 2px 6px ${alpha(getStatusColor(disk.status), 0.3)}`
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Disk Usage Distribution with Enhanced Visualization */}
          <Grid item xs={12}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                    <TrendingUpIcon />
                    Disk Usage Distribution
                    <Tooltip title="Visual representation of disk space allocation">
                      <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </Tooltip>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hover for details
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {disks.map((disk, index) => {
                    const usedPercent = disk.usagePercentage || 0;
                    const freePercent = 100 - usedPercent;
                    
                    return (
                      <Grid item xs={12} md={6} key={index}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2.5,
                            borderRadius: 2,
                            borderColor: alpha(theme.palette.divider, 0.3),
                            '&:hover': {
                              borderColor: alpha(getStatusColor(disk.status), 0.5),
                              backgroundColor: alpha(getStatusColor(disk.status), 0.02)
                            }
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {disk.name || 'Unknown Disk'}
                            </Typography>
                            <Chip
                              label={`${formatPercentage(disk.usagePercentage)} used`}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getStatusColor(disk.status), 0.1),
                                color: getStatusColor(disk.status),
                                fontWeight: 'medium'
                              }}
                            />
                          </Box>
                          
                          {/* Visual Distribution Bar */}
                          <Tooltip 
                            title={
                              <Box>
                                <Typography variant="caption" display="block">
                                  Used: {formatBytes(disk.usedSpace)}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Free: {formatBytes(disk.freeSpace)}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Total: {formatBytes(disk.totalSpace)}
                                </Typography>
                              </Box>
                            }
                          >
                            <Box 
                              sx={{ 
                                height: 24, 
                                borderRadius: 12, 
                                overflow: 'hidden',
                                display: 'flex',
                                cursor: 'pointer',
                                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${usedPercent}%`,
                                  background: `linear-gradient(90deg, ${getStatusColor(disk.status)} 0%, ${alpha(getStatusColor(disk.status), 0.8)} 100%)`,
                                  transition: 'width 0.5s ease',
                                  position: 'relative',
                                  '&:after': {
                                    content: '""',
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '2px',
                                    backgroundColor: 'white',
                                    opacity: 0.5
                                  }
                                }}
                              />
                              <Box
                                sx={{
                                  width: `${freePercent}%`,
                                  background: `linear-gradient(90deg, ${alpha(theme.palette.success.main, 0.6)} 0%, ${alpha(theme.palette.success.main, 0.3)} 100%)`,
                                  transition: 'width 0.5s ease'
                                }}
                              />
                            </Box>
                          </Tooltip>
                          
                          <Box display="flex" justifyContent="space-between" mt={2}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Used Space
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatBytes(disk.usedSpace)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Free Space
                              </Typography>
                              <Typography variant="body2" fontWeight="medium" color="success.main">
                                {formatBytes(disk.freeSpace)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Total
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {formatBytes(disk.totalSpace)}
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Add CSS animations */}
        <style jsx global>{`
          @keyframes pulse {
            0% { opacity: 0.8; }
            50% { opacity: 1; }
            100% { opacity: 0.8; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Box>
    </Fade>
  );
};

export default DiskMetrics;