import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Alert as MuiAlert,
  AlertTitle,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { systemApi } from '../services/api';
import { useWebSocket } from '../services/websocket';
import { getAlertColor } from '../utils/formatters';

const AlertsPanel = () => {
  const { metrics } = useWebSocket();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await systemApi.getAlerts();
        setAlerts(response.data.alerts || []);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (metrics?.alerts) {
      setAlerts(metrics.alerts);
    }
  }, [metrics]);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'ALL') return true;
    return alert.level === filter;
  });

  const criticalCount = alerts.filter(a => a.level === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.level === 'WARNING').length;
  const totalCount = alerts.length;

  const getAlertIcon = (level) => {
    switch (level) {
      case 'CRITICAL':
        return <ErrorIcon />;
      case 'WARNING':
        return <WarningIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Alerts
      </Typography>
      
      {/* Alert Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, backgroundColor: 'rgba(255, 68, 68, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="#ff4444">
                  Critical
                </Typography>
                <Typography variant="h3">{criticalCount}</Typography>
              </Box>
              <ErrorIcon sx={{ fontSize: 48, color: '#ff4444' }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, backgroundColor: 'rgba(255, 187, 51, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="#ffbb33">
                  Warnings
                </Typography>
                <Typography variant="h3">{warningCount}</Typography>
              </Box>
              <WarningIcon sx={{ fontSize: 48, color: '#ffbb33' }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, backgroundColor: 'rgba(0, 200, 81, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="#00C851">
                  Total Alerts
                </Typography>
                <Typography variant="h3">{totalCount}</Typography>
              </Box>
              <FilterIcon sx={{ fontSize: 48, color: '#00C851' }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Active Alerts ({filteredAlerts.length})
          </Typography>
          
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(e, newFilter) => newFilter && setFilter(newFilter)}
            size="small"
          >
            <ToggleButton value="ALL">
              <Chip label="All" size="small" />
            </ToggleButton>
            <ToggleButton value="CRITICAL">
              <Chip label="Critical" size="small" color="error" />
            </ToggleButton>
            <ToggleButton value="WARNING">
              <Chip label="Warning" size="small" color="warning" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: '#00C851', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No active alerts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All systems are operating normally
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredAlerts.map((alert, index) => (
            <Grid item xs={12} key={index}>
              <MuiAlert
                severity={alert.level === 'CRITICAL' ? 'error' : 'warning'}
                icon={getAlertIcon(alert.level)}
                sx={{ mb: 1 }}
              >
                <AlertTitle>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">
                      {alert.type} Alert
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(alert.timestamp)}
                    </Typography>
                  </Box>
                </AlertTitle>
                {alert.message}
                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    Current: {alert.value} | Threshold: {alert.threshold}
                  </Typography>
                </Box>
              </MuiAlert>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Alert History */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Alert History
        </Typography>
        <Grid container spacing={2}>
          {alerts.slice(0, 10).map((alert, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getAlertIcon(alert.level)}
                    <Typography variant="subtitle2" sx={{ ml: 1, flex: 1 }}>
                      {alert.type}
                    </Typography>
                    <Chip
                      label={alert.level}
                      size="small"
                      sx={{
                        backgroundColor: getAlertColor(alert.level),
                        color: 'white',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(alert.timestamp)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default AlertsPanel;