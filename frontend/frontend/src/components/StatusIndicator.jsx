import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { getStatusColor } from '../utils/formatters';

const StatusIndicator = ({ status, label, value, unit = '' }) => {
  const getStatusLabel = (status) => {
    switch (status) {
      case 'CRITICAL':
        return 'Critical';
      case 'WARNING':
        return 'Warning';
      case 'HEALTHY':
        return 'Healthy';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        border: `2px solid ${getStatusColor(status)}`,
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      
      <Box position="relative" display="inline-flex" mb={1}>
        <CircularProgress
          variant="determinate"
          value={value}
          size={80}
          thickness={4}
          sx={{
            color: getStatusColor(status),
          }}
        />
        <Box
          top={0}
          left={0}
          bottom={0}
          right={0}
          position="absolute"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h6" component="div">
            {value.toFixed(1)}{unit}
          </Typography>
        </Box>
      </Box>
      
      <Typography
        variant="caption"
        sx={{
          color: getStatusColor(status),
          fontWeight: 'bold',
        }}
      >
        {getStatusLabel(status)}
      </Typography>
    </Box>
  );
};

export default StatusIndicator;