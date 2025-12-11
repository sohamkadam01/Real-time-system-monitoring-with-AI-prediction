import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Typography, Box, Paper } from '@mui/material';

const RealTimeChart = ({ data, dataKey, color, unit = '', title = '' }) => {
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  // Monitor container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setChartDimensions({ width, height });
        }
      }
    };

    updateDimensions();
    
    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Fallback for browsers without ResizeObserver
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  if (!data || data.length === 0) {
    return (
      <Box 
        ref={containerRef} 
        height="100%" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        sx={{ minHeight: 200 }}
      >
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, backgroundColor: 'rgba(0, 0, 0, 0.8)' }} elevation={3}>
          <Typography variant="body2" color="white">
            Time: {formatTime(label)}
          </Typography>
          <Typography variant="body2" color={color} fontWeight="bold">
            Value: {payload[0].value?.toFixed(1) || '0.0'}{unit}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Ensure we have valid dimensions
  if (chartDimensions.width <= 0 || chartDimensions.height <= 0) {
    return (
      <Box 
        ref={containerRef} 
        height="100%" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        sx={{ minHeight: 200, minWidth: 100 }}
      >
        <Typography color="text.secondary">Loading chart...</Typography>
      </Box>
    );
  }

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', minHeight: 200 }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <AreaChart 
          data={data} 
          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" strokeOpacity={0.5} />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke="#888"
            fontSize={11}
            tick={{ fill: '#aaa' }}
          />
          <YAxis
            stroke="#888"
            fontSize={11}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}${unit}`}
            tick={{ fill: '#aaa' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.2}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default RealTimeChart;