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
} from '@mui/material';
import {
  ArrowUpward as UploadIcon,
  ArrowDownward as DownloadIcon,
  Wifi as WifiIcon,
  Lan as LanIcon,
} from '@mui/icons-material';
import { systemApi } from '../services/api';
import { formatBytes } from '../utils/formatters';

const NetworkMetrics = () => {
  const [networks, setNetworks] = useState([]);

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        const response = await systemApi.getNetworks();
        setNetworks(response.data.networks || []);
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Network Metrics
      </Typography>
      
      <Grid container spacing={3}>
        {/* Network Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Network Interfaces
            </Typography>
            
            {networks.length > 0 ? (
              <Grid container spacing={2}>
                {networks.slice(0, 4).map((network, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper sx={{ p: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        {getNetworkTypeIcon(network.name)}
                        <Typography variant="subtitle1" sx={{ ml: 1 }}>
                          {network.displayName || network.name}
                        </Typography>
                      </Box>
                      
                      <Box mt={2}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <UploadIcon fontSize="small" sx={{ mr: 1, color: '#4caf50' }} />
                          <Typography variant="body2" color="text.secondary">
                            Upload
                          </Typography>
                          <Box flex={1} />
                          <Typography variant="body2">
                            {formatBytes(network.uploadSpeed)}/s
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center">
                          <DownloadIcon fontSize="small" sx={{ mr: 1, color: '#ff9800' }} />
                          <Typography variant="body2" color="text.secondary">
                            Download
                          </Typography>
                          <Box flex={1} />
                          <Typography variant="body2">
                            {formatBytes(network.downloadSpeed)}/s
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box mt={2} pt={1} borderTop="1px solid rgba(255, 255, 255, 0.1)">
                        <Typography variant="caption" color="text.secondary">
                          Total Sent: {formatBytes(network.bytesSent)}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Total Received: {formatBytes(network.bytesReceived)}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary" align="center">
                No network interfaces found
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Detailed Network Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Network Interface Details
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Interface</TableCell>
                    <TableCell>Display Name</TableCell>
                    <TableCell align="right">Total Sent</TableCell>
                    <TableCell align="right">Total Received</TableCell>
                    <TableCell align="right">Upload Speed</TableCell>
                    <TableCell align="right">Download Speed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {networks.map((network, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getNetworkTypeIcon(network.name)}
                          <Typography sx={{ ml: 1 }}>{network.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{network.displayName}</TableCell>
                      <TableCell align="right">{formatBytes(network.bytesSent)}</TableCell>
                      <TableCell align="right">{formatBytes(network.bytesReceived)}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          <UploadIcon fontSize="small" sx={{ mr: 1, color: '#4caf50' }} />
                          {formatBytes(network.uploadSpeed)}/s
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          <DownloadIcon fontSize="small" sx={{ mr: 1, color: '#ff9800' }} />
                          {formatBytes(network.downloadSpeed)}/s
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Network Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Network Activity
            </Typography>
            
            <Box sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Data Transferred
              </Typography>
              
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Box>
                  <UploadIcon fontSize="small" sx={{ color: '#4caf50', mr: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Upload Total
                  </Typography>
                  <Typography variant="h6">
                    {formatBytes(networks.reduce((sum, net) => sum + net.bytesSent, 0))}
                  </Typography>
                </Box>
                
                <Box>
                  <DownloadIcon fontSize="small" sx={{ color: '#ff9800', mr: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Download Total
                  </Typography>
                  <Typography variant="h6">
                    {formatBytes(networks.reduce((sum, net) => sum + net.bytesReceived, 0))}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Network Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Network Status
            </Typography>
            
            <Box sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Active Interfaces
                </Typography>
                <Chip label={networks.length} color="primary" />
              </Box>
              
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Interface Types
                </Typography>
                <Box>
                  {networks.some(n => n.name.toLowerCase().includes('wifi')) && (
                    <Chip icon={<WifiIcon />} label="WiFi" size="small" sx={{ mr: 1 }} />
                  )}
                  {networks.some(n => !n.name.toLowerCase().includes('wifi')) && (
                    <Chip icon={<LanIcon />} label="Ethernet" size="small" />
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NetworkMetrics;