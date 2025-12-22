import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowUpward as UploadIcon,
  ArrowDownward as DownloadIcon,
  Wifi as WifiIcon,
  Lan as LanIcon,
  Speed as SpeedIcon,
  NetworkWifi as NetworkWifiIcon,
  SettingsEthernet as EthernetIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { systemApi } from '../services/api';
import { formatBytes, formatNetworkSpeed } from '../utils/formatters';

const NetworkMetrics = () => {
  const theme = useTheme();
  const [networks, setNetworks] = useState([]);
  const [totalStats, setTotalStats] = useState({
    totalUpload: 0,
    totalDownload: 0,
    totalSpeed: 0,
    activeInterfaces: 0
  });

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        const response = await systemApi.getNetworks();
        const networkData = response.data.networks || [];
        setNetworks(networkData);
        
        // Calculate total stats
        const uploadTotal = networkData.reduce((sum, net) => sum + (net.bytesSent || 0), 0);
        const downloadTotal = networkData.reduce((sum, net) => sum + (net.bytesReceived || 0), 0);
        const speedTotal = networkData.reduce((sum, net) => sum + (net.uploadSpeed || 0) + (net.downloadSpeed || 0), 0);
        
        setTotalStats({
          totalUpload: uploadTotal,
          totalDownload: downloadTotal,
          totalSpeed: speedTotal,
          activeInterfaces: networkData.length
        });
      } catch (error) {
        console.error('Error fetching network data:', error);
      }
    };

    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getNetworkTypeIcon = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('wifi') || nameLower.includes('wireless')) {
      return <WifiIcon />;
    }
    return <LanIcon />;
  };

  const getNetworkColor = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('wifi') || nameLower.includes('wireless')) {
      return '#00ff88'; // Green for wireless
    }
    return '#33aaff'; // Blue for wired
  };

  const getSpeedPercentage = (speed, maxSpeed = 1000000000) => { // 1 Gbps as default max
    return Math.min(100, (speed / maxSpeed) * 100);
  };

  // Sort networks by total activity (upload + download speed)
  const sortedNetworks = [...networks].sort((a, b) => 
    ((b.uploadSpeed || 0) + (b.downloadSpeed || 0)) - 
    ((a.uploadSpeed || 0) + (a.downloadSpeed || 0))
  );

  const primaryNetwork = sortedNetworks[0];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Network Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time network interface monitoring
          </Typography>
        </Box>
        <Chip 
          label={`${totalStats.activeInterfaces} Active`} 
          color="primary"
          variant="outlined"
        />
      </Box>
      
      <Grid container spacing={3}>
        {/* Primary Network Overview */}
        {primaryNetwork && (
          <Grid item xs={12}>
            <Card sx={{ 
              backgroundColor: '#111111',
              border: '1px solid #333333',
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 2,
                      backgroundColor: alpha(getNetworkColor(primaryNetwork.name), 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getNetworkColor(primaryNetwork.name),
                    }}>
                      {getNetworkTypeIcon(primaryNetwork.name)}
                    </Box>
                    <Box>
                      <Typography variant="h6">
                        {primaryNetwork.displayName || primaryNetwork.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Primary Network Interface
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    icon={getNetworkTypeIcon(primaryNetwork.name)}
                    label={primaryNetwork.name.toLowerCase().includes('wifi') ? 'WiFi' : 'Ethernet'}
                    size="small"
                    sx={{ 
                      backgroundColor: alpha(getNetworkColor(primaryNetwork.name), 0.1),
                      color: getNetworkColor(primaryNetwork.name),
                    }}
                  />
                </Box>

                <Grid container spacing={3} mt={1}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#000000' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Upload Activity
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <UploadIcon sx={{ color: '#00ff88' }} />
                        <Box flex={1}>
                          <Typography variant="h5">
                            {formatBytes(primaryNetwork.uploadSpeed || 0)}/s
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={getSpeedPercentage(primaryNetwork.uploadSpeed || 0)}
                        sx={{
                          height: 4,
                          backgroundColor: alpha('#00ff88', 0.2),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#00ff88',
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Total: {formatBytes(primaryNetwork.bytesSent || 0)}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#000000' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Download Activity
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <DownloadIcon sx={{ color: '#33aaff' }} />
                        <Box flex={1}>
                          <Typography variant="h5">
                            {formatBytes(primaryNetwork.downloadSpeed || 0)}/s
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={getSpeedPercentage(primaryNetwork.downloadSpeed || 0)}
                        sx={{
                          height: 4,
                          backgroundColor: alpha('#33aaff', 0.2),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#33aaff',
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Total: {formatBytes(primaryNetwork.bytesReceived || 0)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Network Interface Cards */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Network Interfaces
          </Typography>
          {sortedNetworks.length > 0 ? (
            <Grid container spacing={2}>
              {sortedNetworks.map((network, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card sx={{ 
                    height: '100%',
                    backgroundColor: '#111111',
                    border: '1px solid #333333',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: getNetworkColor(network.name),
                      transform: 'translateY(-2px)',
                    }
                  }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: 1,
                            backgroundColor: alpha(getNetworkColor(network.name), 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: getNetworkColor(network.name),
                          }}>
                            {getNetworkTypeIcon(network.name)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2">
                              {network.displayName || network.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {network.name}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={getNetworkTypeIcon(network.name) ? 'WiFi' : 'LAN'}
                          size="small"
                          sx={{ 
                            backgroundColor: alpha(getNetworkColor(network.name), 0.1),
                            color: getNetworkColor(network.name),
                            fontSize: '0.65rem',
                            height: 20,
                          }}
                        />
                      </Box>

                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Upload
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <UploadIcon sx={{ fontSize: 16, color: '#00ff88' }} />
                            <Typography variant="body2" fontWeight={500}>
                              {formatBytes(network.uploadSpeed || 0)}/s
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Download
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <DownloadIcon sx={{ fontSize: 16, color: '#33aaff' }} />
                            <Typography variant="body2" fontWeight={500}>
                              {formatBytes(network.downloadSpeed || 0)}/s
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>

                      <Box mt={2} pt={2} borderTop="1px solid #333333">
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Sent
                            </Typography>
                            <Typography variant="caption" fontWeight={500}>
                              {formatBytes(network.bytesSent || 0)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Received
                            </Typography>
                            <Typography variant="caption" fontWeight={500}>
                              {formatBytes(network.bytesReceived || 0)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ 
              p: 4, 
              textAlign: 'center',
              backgroundColor: '#111111',
              border: '1px solid #333333',
            }}>
              <NetworkWifiIcon sx={{ fontSize: 48, color: '#666666', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Network Interfaces
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No active network interfaces detected
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Statistics Cards */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            backgroundColor: '#111111',
            border: '1px solid #333333',
            height: '100%',
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <SpeedIcon sx={{ color: '#ffffff' }} />
                <Typography variant="h6">
                  Total Network Activity
                </Typography>
              </Box>

              <Stack spacing={3}>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Total Upload
                    </Typography>
                    <Typography variant="h5">
                      {formatBytes(totalStats.totalUpload)}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={getSpeedPercentage(totalStats.totalUpload, 10000000000)}
                    sx={{
                      height: 6,
                      backgroundColor: alpha('#00ff88', 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#00ff88',
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Total Download
                    </Typography>
                    <Typography variant="h5">
                      {formatBytes(totalStats.totalDownload)}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={getSpeedPercentage(totalStats.totalDownload, 10000000000)}
                    sx={{
                      height: 6,
                      backgroundColor: alpha('#33aaff', 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#33aaff',
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Current Speed
                    </Typography>
                    <Typography variant="h6">
                      {formatBytes(totalStats.totalSpeed)}/s
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Interface Details Table */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            backgroundColor: '#111111',
            border: '1px solid #333333',
            height: '100%',
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Interface Details
                </Typography>
                <Tooltip title="Updated every 3 seconds">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Interface</TableCell>
                      <TableCell align="right">Upload</TableCell>
                      <TableCell align="right">Download</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedNetworks.map((network, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { backgroundColor: alpha('#ffffff', 0.05) },
                          '&:last-child td, &:last-child th': { border: 0 }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ color: getNetworkColor(network.name) }}>
                              {getNetworkTypeIcon(network.name)}
                            </Box>
                            <Typography variant="body2">
                              {network.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                            <UploadIcon sx={{ fontSize: 14, color: '#00ff88' }} />
                            <Typography variant="body2">
                              {formatBytes(network.uploadSpeed || 0)}/s
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                            <DownloadIcon sx={{ fontSize: 14, color: '#33aaff' }} />
                            <Typography variant="body2">
                              {formatBytes(network.downloadSpeed || 0)}/s
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {sortedNetworks.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No network interfaces available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Interface Type Summary */}
        <Grid item xs={12}>
          <Card sx={{ 
            backgroundColor: '#111111',
            border: '1px solid #333333',
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Interface Summary
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, backgroundColor: '#000000' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <WifiIcon sx={{ color: '#00ff88' }} />
                        <Typography variant="body2" fontWeight={500}>
                          Wireless Interfaces
                        </Typography>
                      </Box>
                      <Chip 
                        label={
                          sortedNetworks.filter(n => 
                            n.name.toLowerCase().includes('wifi') || 
                            n.name.toLowerCase().includes('wireless')
                          ).length
                        }
                        size="small"
                        sx={{ 
                          backgroundColor: alpha('#00ff88', 0.1),
                          color: '#00ff88',
                        }}
                      />
                    </Box>
                    {sortedNetworks
                      .filter(n => n.name.toLowerCase().includes('wifi') || n.name.toLowerCase().includes('wireless'))
                      .map((network, index) => (
                        <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="caption">
                            {network.displayName || network.name}
                          </Typography>
                          <Typography variant="caption" color="#00ff88">
                            {formatBytes((network.uploadSpeed || 0) + (network.downloadSpeed || 0))}/s
                          </Typography>
                        </Box>
                      ))}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, backgroundColor: '#000000' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <EthernetIcon sx={{ color: '#33aaff' }} />
                        <Typography variant="body2" fontWeight={500}>
                          Wired Interfaces
                        </Typography>
                      </Box>
                      <Chip 
                        label={
                          sortedNetworks.filter(n => 
                            !n.name.toLowerCase().includes('wifi') && 
                            !n.name.toLowerCase().includes('wireless')
                          ).length
                        }
                        size="small"
                        sx={{ 
                          backgroundColor: alpha('#33aaff', 0.1),
                          color: '#33aaff',
                        }}
                      />
                    </Box>
                    {sortedNetworks
                      .filter(n => !n.name.toLowerCase().includes('wifi') && !n.name.toLowerCase().includes('wireless'))
                      .map((network, index) => (
                        <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="caption">
                            {network.displayName || network.name}
                          </Typography>
                          <Typography variant="caption" color="#33aaff">
                            {formatBytes((network.uploadSpeed || 0) + (network.downloadSpeed || 0))}/s
                          </Typography>
                        </Box>
                      ))}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NetworkMetrics;