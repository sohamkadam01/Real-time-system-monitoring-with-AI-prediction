// AlertTrendChart.jsx - Updated for black theme
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Box, Typography, useTheme, Paper } from '@mui/material';
import { TrendingUp, TrendingDown, Timeline } from '@mui/icons-material';
import { formatTime, formatDate, formatPercentage } from '../utils/formatters';

const AlertTrendChart = ({ alerts }) => {
  const theme = useTheme();

  // Process alert data for the chart
  const chartData = useMemo(() => {
    // Group alerts by hour for the last 24 hours
    const hours = 24;
    const now = new Date();
    const data = [];
    
    // Initialize data points for last 24 hours
    for (let i = hours - 1; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(time.getHours() - i);
      
      data.push({
        hour: time.getHours(),
        timeLabel: formatTime(time.getTime()),
        dateLabel: formatDate(time.getTime()),
        critical: 0,
        warning: 0,
        info: 0,
        total: 0,
        hourString: time.toISOString().slice(0, 13)
      });
    }
    
    // Count alerts by hour
    alerts.forEach(alert => {
      const alertTime = new Date(alert.timestamp);
      const hourString = alertTime.toISOString().slice(0, 13);
      
      const dataPoint = data.find(d => d.hourString === hourString);
      if (dataPoint) {
        const level = alert.level?.toLowerCase();
        if (level in dataPoint) {
          dataPoint[level] += 1;
          dataPoint.total += 1;
        }
      }
    });
    
    return data;
  }, [alerts]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (alerts.length === 0) return { trend: 0, avgAlerts: 0, peakHour: 'N/A' };
    
    const totals = chartData.map(d => d.total);
    const avgAlerts = totals.reduce((a, b) => a + b, 0) / totals.length;
    
    // Find peak hour
    const peakData = chartData.reduce((max, current) => 
      current.total > max.total ? current : max, { total: 0, timeLabel: 'N/A' }
    );
    
    // Calculate trend (last 6 hours vs previous 6 hours)
    const recentHours = chartData.slice(-6);
    const previousHours = chartData.slice(-12, -6);
    const recentAvg = recentHours.reduce((a, b) => a + b.total, 0) / 6;
    const previousAvg = previousHours.reduce((a, b) => a + b.total, 0) / 6;
    const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
    
    return {
      trend: Math.round(trend * 10) / 10,
      avgAlerts: Math.round(avgAlerts * 100) / 100,
      peakHour: peakData.timeLabel,
      peakCount: peakData.total
    };
  }, [chartData, alerts]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ 
          p: 2, 
          backgroundColor: '#111111',
          border: '1px solid #333333'
        }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Box key={index} display="flex" justifyContent="space-between" gap={2} mb={0.5}>
              <Typography variant="caption" style={{ color: entry.color }}>
                {entry.dataKey.toUpperCase()}:
              </Typography>
              <Typography variant="caption">
                {entry.value}
              </Typography>
            </Box>
          ))}
          <Box display="flex" justifyContent="space-between" gap={2} mt={1} pt={1} borderTop="1px solid #333333">
            <Typography variant="caption">TOTAL:</Typography>
            <Typography variant="caption" fontWeight={600}>
              {payload.reduce((sum, entry) => sum + entry.value, 0)}
            </Typography>
          </Box>
        </Paper>
      );
    }
    return null;
  };

  // Colors for black theme
  const colors = {
    critical: '#ff4444',
    warning: '#ffaa33',
    info: '#33aaff',
    total: '#ffffff',
    success: '#00ff88'
  };

  return (
    <Box>
      {/* Stats Overview */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Alert Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last 24 hours
          </Typography>
        </Box>
        
        <Box display="flex" gap={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Trend
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              {stats.trend >= 0 ? (
                <TrendingUp sx={{ color: colors.critical }} />
              ) : (
                <TrendingDown sx={{ color: colors.success }} />
              )}
              <Typography 
                variant="h6" 
                color={stats.trend >= 0 ? colors.critical : colors.success}
              >
                {stats.trend >= 0 ? '+' : ''}{stats.trend}%
              </Typography>
            </Box>
          </Box>
          
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Avg/Hour
            </Typography>
            <Typography variant="h6">
              {stats.avgAlerts}
            </Typography>
          </Box>
          
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Peak
            </Typography>
            <Typography variant="h6">
              {stats.peakHour}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Chart */}
      <Box height={250}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#333333"
              vertical={false}
            />
            <XAxis 
              dataKey="timeLabel" 
              stroke="#666666"
              tick={{ fill: '#666666' }}
              axisLine={{ stroke: '#333333' }}
              tickLine={{ stroke: '#333333' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#666666"
              tick={{ fill: '#666666' }}
              axisLine={{ stroke: '#333333' }}
              tickLine={{ stroke: '#333333' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              name="Total"
              stroke={colors.total}
              fill={colors.total}
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="critical"
              name="Critical"
              stroke={colors.critical}
              fill={colors.critical}
              fillOpacity={0.2}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="warning"
              name="Warning"
              stroke={colors.warning}
              fill={colors.warning}
              fillOpacity={0.2}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>

      {/* Distribution bars */}
      <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom>
          Alert Distribution
        </Typography>
        <Box display="flex" gap={1} height={40} alignItems="flex-end">
          <Box flex={1} sx={{ position: 'relative' }}>
            <Box
              sx={{
                height: `${Math.min(100, (alerts.filter(a => a.level === 'CRITICAL').length / Math.max(1, alerts.length)) * 100)}%`,
                backgroundColor: colors.critical,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              }}
            />
            <Typography variant="caption" sx={{ position: 'absolute', bottom: -20, width: '100%', textAlign: 'center' }}>
              Critical
            </Typography>
          </Box>
          <Box flex={1} sx={{ position: 'relative' }}>
            <Box
              sx={{
                height: `${Math.min(100, (alerts.filter(a => a.level === 'WARNING').length / Math.max(1, alerts.length)) * 100)}%`,
                backgroundColor: colors.warning,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              }}
            />
            <Typography variant="caption" sx={{ position: 'absolute', bottom: -20, width: '100%', textAlign: 'center' }}>
              Warning
            </Typography>
          </Box>
          <Box flex={1} sx={{ position: 'relative' }}>
            <Box
              sx={{
                height: `${Math.min(100, (alerts.filter(a => a.level === 'INFO').length / Math.max(1, alerts.length)) * 100)}%`,
                backgroundColor: colors.info,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              }}
            />
            <Typography variant="caption" sx={{ position: 'absolute', bottom: -20, width: '100%', textAlign: 'center' }}>
              Info
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Summary */}
      <Box mt={3} p={2} bgcolor="#111111" borderRadius={1}>
        <Typography variant="body2">
          <Timeline fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
          {stats.trend >= 0 ? (
            <>Alert frequency is increasing by {Math.abs(stats.trend)}% compared to previous period.</>
          ) : (
            <>Alert frequency is decreasing by {Math.abs(stats.trend)}% compared to previous period.</>
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export default AlertTrendChart;