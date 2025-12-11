import React from 'react';
import { Paper, Typography, Box, Chip, LinearProgress, IconButton } from '@mui/material';
import { Refresh, Wifi, WifiOff } from '@mui/icons-material';
import { useWebSocket } from '../services/websocket';

const ConnectionStatus = () => {
  const { connected, loading, lastUpdate, pollCount, refreshMetrics, getLastUpdateText } = useWebSocket();

  return (
    <Paper sx={{ 
      p: 2, 
      mb: 3,
      backgroundColor: connected ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
      border: `1px solid ${connected ? '#4caf50' : '#f44336'}`,
    }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Box sx={{ 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            backgroundColor: connected ? '#4caf50' : '#f44336',
            mr: 2,
            animation: connected ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 },
            }
          }} />
          
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {connected ? 'Live Polling Active' : 'Connection Lost'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {connected ? 'Updating every 3 seconds' : 'Trying to reconnect...'}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Chip 
            icon={connected ? <Wifi /> : <WifiOff />}
            label={connected ? 'Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
            size="small"
          />
          
          <Chip 
            label={`Poll #${pollCount}`}
            variant="outlined"
            size="small"
          />
          
          <IconButton 
            size="small" 
            onClick={refreshMetrics}
            disabled={loading}
            title="Refresh now"
          >
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {loading && (
        <Box mt={1}>
          <LinearProgress sx={{ height: 2 }} />
        </Box>
      )}

      <Box mt={1} display="flex" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {getLastUpdateText()}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Next update in 3s
        </Typography>
      </Box>
    </Paper>
  );
};

export default ConnectionStatus;