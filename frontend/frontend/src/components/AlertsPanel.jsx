
// google gemini step 7 from google gemini.


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
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Insights as InsightsIcon,
} from '@mui/icons-material';
import { systemApi } from '../services/api';
import { useWebSocket } from '../services/websocket';
import { getAlertColor } from '../utils/formatters';
import AlertTrendChart from './AlertTrendChart';
const AlertsPanel = () => {
  const { metrics, aiInsights, analyzing, triggerManualAnalysis, getLastAnalysisText } = useWebSocket();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [showAIPredictions, setShowAIPredictions] = useState(true);
  const [lastManualAnalysis, setLastManualAnalysis] = useState(null);

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

  // Merge AI predictions with system alerts
  const allAlerts = [
    // System alerts
    ...alerts.map(alert => ({ ...alert, source: 'system' })),
    
    // AI predictions (if enabled)
    ...(showAIPredictions && aiInsights?.predictions?.map((prediction, index) => ({
      id: `ai-pred-${index}`,
      type: 'AI_PREDICTION',
      level: 'PREDICTION',
      message: prediction,
      timestamp: aiInsights.timestamp || new Date().getTime(),
      source: 'ai',
      isPrediction: true
    })) || []),
    
    // AI recommendations
    ...(showAIPredictions && aiInsights?.recommendations?.map((recommendation, index) => ({
      id: `ai-rec-${index}`,
      type: 'AI_RECOMMENDATION',
      level: 'INFO',
      message: recommendation,
      timestamp: aiInsights.timestamp || new Date().getTime(),
      source: 'ai',
      isRecommendation: true
    })) || []),
    
    // AI bottlenecks
    ...(showAIPredictions && aiInsights?.bottlenecks?.map((bottleneck, index) => ({
      id: `ai-bottleneck-${index}`,
      type: 'AI_BOTTLENECK',
      level: 'WARNING',
      message: bottleneck,
      timestamp: aiInsights.timestamp || new Date().getTime(),
      source: 'ai',
      isBottleneck: true
    })) || [])
  ];

  const filteredAlerts = allAlerts.filter(alert => {
    if (filter === 'ALL') return true;
    if (filter === 'AI') return alert.source === 'ai';
    if (filter === 'SYSTEM') return alert.source === 'system';
    return alert.level === filter;
  });

  // Count statistics
  const criticalCount = alerts.filter(a => a.level === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.level === 'WARNING').length;
  const aiPredictionCount = aiInsights?.predictions?.length || 0;
  const aiRecommendationCount = aiInsights?.recommendations?.length || 0;
  const aiBottleneckCount = aiInsights?.bottlenecks?.length || 0;
  const totalAICount = aiPredictionCount + aiRecommendationCount + aiBottleneckCount;
  const totalCount = alerts.length + totalAICount;

  const getAlertIcon = (level, source) => {
    if (source === 'ai') {
      return <PsychologyIcon />;
    }
    
    switch (level) {
      case 'CRITICAL':
        return <ErrorIcon />;
      case 'WARNING':
        return <WarningIcon />;
      case 'PREDICTION':
        return <TimelineIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getAlertColorEnhanced = (level, source) => {
    if (source === 'ai') {
      return '#673ab7'; // Purple for AI
    }
    return getAlertColor(level);
  };

  const getAlertSeverity = (level, source) => {
    if (source === 'ai') return 'info';
    if (level === 'CRITICAL') return 'error';
    if (level === 'WARNING') return 'warning';
    if (level === 'PREDICTION') return 'info';
    return 'info';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  };

  const handleManualAIAnalysis = () => {
    triggerManualAnalysis();
    setLastManualAnalysis(new Date());
  };

  const handleToggleAIPredictions = () => {
    setShowAIPredictions(!showAIPredictions);
  };

  return (
    <Box>
      {/* Header with AI Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          System Alerts & AI Insights
        </Typography>
        
        <Box display="flex" alignItems="center" gap={1}>
          {/* AI Analysis Button */}
          <Tooltip title="Run AI Analysis">
            <IconButton 
              size="small" 
              onClick={handleManualAIAnalysis}
              disabled={analyzing}
              color="secondary"
              sx={{ 
                backgroundColor: 'rgba(103, 58, 183, 0.1)',
                '&:hover': { backgroundColor: 'rgba(103, 58, 183, 0.2)' }
              }}
            >
              <InsightsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Toggle AI Predictions */}
          <Tooltip title={showAIPredictions ? "Hide AI Insights" : "Show AI Insights"}>
            <IconButton 
              size="small" 
              onClick={handleToggleAIPredictions}
              color={showAIPredictions ? "secondary" : "default"}
              sx={{ 
                backgroundColor: showAIPredictions ? 'rgba(103, 58, 183, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                '&:hover': { 
                  backgroundColor: showAIPredictions ? 'rgba(103, 58, 183, 0.2)' : 'rgba(158, 158, 158, 0.2)' 
                }
              }}
            >
              <PsychologyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* AI Analysis Status */}
      {(analyzing || lastManualAnalysis) && (
        <Paper sx={{ p: 1.5, mb: 2, backgroundColor: 'rgba(103, 58, 183, 0.1)' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              {analyzing ? (
                <>
                  <PsychologyIcon sx={{ mr: 1, color: '#673ab7', animation: 'pulse 1s infinite' }} />
                  <Typography variant="body2" color="#673ab7">
                    AI is analyzing system metrics...
                  </Typography>
                </>
              ) : (
                <>
                  <CheckCircleIcon sx={{ mr: 1, color: '#673ab7' }} />
                  <Typography variant="body2" color="#673ab7">
                    AI analysis completed at {lastManualAnalysis?.toLocaleTimeString()}
                  </Typography>
                </>
              )}
            </Box>
            {aiInsights?.timestamp && (
              <Typography variant="caption" color="text.secondary">
                Last analysis: {getLastAnalysisText()}
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* Alert Summary with AI Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
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
            <Typography variant="caption" color="text.secondary">
              System alerts
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
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
            <Typography variant="caption" color="text.secondary">
              System alerts
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, backgroundColor: 'rgba(103, 58, 183, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="#673ab7">
                  AI Insights
                </Typography>
                <Typography variant="h3">{totalAICount}</Typography>
              </Box>
              <Box position="relative">
                <PsychologyIcon sx={{ fontSize: 48, color: '#673ab7' }} />
                {aiPredictionCount > 0 && (
                  <Badge 
                    badgeContent={aiPredictionCount} 
                    color="secondary"
                    sx={{
                      position: 'absolute',
                      top: -5,
                      right: -5,
                    }}
                  />
                )}
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {aiPredictionCount} predictions, {aiRecommendationCount} recommendations
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, backgroundColor: 'rgba(0, 200, 81, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="#00C851">
                  Total
                </Typography>
                <Typography variant="h3">{totalCount}</Typography>
              </Box>
              <FilterIcon sx={{ fontSize: 48, color: '#00C851' }} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Combined alerts & insights
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Controls with AI Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">
              Active Alerts & Insights ({filteredAlerts.length})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Showing {showAIPredictions ? 'with' : 'without'} AI insights
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={(e, newFilter) => newFilter && setFilter(newFilter)}
              size="small"
            >
              <ToggleButton value="ALL">
                <Chip label="All" size="small" />
              </ToggleButton>
              <ToggleButton value="SYSTEM">
                <Chip label="System" size="small" color="primary" />
              </ToggleButton>
              <ToggleButton value="AI">
                <Chip 
                  label="AI" 
                  size="small" 
                  color="secondary"
                  icon={<PsychologyIcon />}
                />
              </ToggleButton>
              <ToggleButton value="CRITICAL">
                <Chip label="Critical" size="small" color="error" />
              </ToggleButton>
              <ToggleButton value="WARNING">
                <Chip label="Warning" size="small" color="warning" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Paper>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: '#00C851', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No active alerts or insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All systems are operating normally
          </Typography>
          {!showAIPredictions && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Enable AI insights for predictive monitoring
            </Typography>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredAlerts.map((alert, index) => (
            <Grid item xs={12} key={alert.id || index}>
              <MuiAlert
                severity={getAlertSeverity(alert.level, alert.source)}
                icon={getAlertIcon(alert.level, alert.source)}
                sx={{ 
                  mb: 1,
                  borderLeft: `4px solid ${getAlertColorEnhanced(alert.level, alert.source)}`,
                  backgroundColor: alert.source === 'ai' 
                    ? 'rgba(103, 58, 183, 0.05)' 
                    : undefined
                }}
              >
                <AlertTitle>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1">
                        {alert.type}
                      </Typography>
                      {alert.source === 'ai' && (
                        <Chip 
                          label={alert.isPrediction ? 'Prediction' : 
                                 alert.isRecommendation ? 'Recommendation' : 
                                 alert.isBottleneck ? 'Bottleneck' : 'AI'}
                          size="small" 
                          color="secondary"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(alert.timestamp)}
                      </Typography>
                      {alert.source === 'ai' && (
                        <PsychologyIcon sx={{ fontSize: 16, color: '#673ab7' }} />
                      )}
                    </Box>
                  </Box>
                </AlertTitle>
                {alert.message}
                {alert.source === 'system' && alert.value && (
                  <Box mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      Current: {alert.value} | Threshold: {alert.threshold}
                    </Typography>
                  </Box>
                )}
                {alert.source === 'ai' && aiInsights?.healthScore && (
                  <Box mt={1}>
                    <Typography variant="caption" color="#673ab7">
                      System Health Score: {aiInsights.healthScore}/10
                    </Typography>
                  </Box>
                )}
              </MuiAlert>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Alert History with AI Insights */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Alert & Insight History
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last 24 hours
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          {/* Recent System Alerts */}
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <WarningIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Recent System Alerts</Typography>
                  <Box flex={1} />
                  <Chip label={alerts.length} size="small" color="primary" />
                </Box>
                {alerts.slice(0, 5).map((alert, index) => (
                  <Box key={index} sx={{ mb: 1.5, p: 1.5, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="body2" fontWeight="medium">
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
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(alert.timestamp)}
                    </Typography>
                  </Box>
                ))}
                {alerts.length === 0 && (
                  <Typography color="text.secondary" align="center" py={2}>
                    No recent system alerts
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent AI Insights */}
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: 'rgba(103, 58, 183, 0.1)', height: '100%', border: '1px solid rgba(103, 58, 183, 0.3)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PsychologyIcon sx={{ mr: 1, color: '#673ab7' }} />
                  <Typography variant="subtitle1" color="#673ab7">
                    Recent AI Insights
                  </Typography>
                  <Box flex={1} />
                  <Chip 
                    label={totalAICount} 
                    size="small" 
                    color="secondary"
                    icon={<PsychologyIcon />}
                  />
                </Box>
                
                {/* AI Predictions */}
                {aiPredictionCount > 0 && (
                  <Box mb={2}>
                    <Typography variant="caption" fontWeight="medium" color="#673ab7" sx={{ display: 'block', mb: 1 }}>
                      Predictions ({aiPredictionCount})
                    </Typography>
                    {aiInsights.predictions.slice(0, 3).map((prediction, index) => (
                      <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: 'rgba(103, 58, 183, 0.1)', borderRadius: 1 }}>
                        <Typography variant="caption">
                          🔮 {prediction}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                
                {/* AI Recommendations */}
                {aiRecommendationCount > 0 && (
                  <Box mb={2}>
                    <Typography variant="caption" fontWeight="medium" color="#4caf50" sx={{ display: 'block', mb: 1 }}>
                      Recommendations ({aiRecommendationCount})
                    </Typography>
                    {aiInsights.recommendations.slice(0, 2).map((recommendation, index) => (
                      <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
                        <Typography variant="caption">
                          💡 {recommendation}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                
                {/* AI Bottlenecks */}
                {aiBottleneckCount > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight="medium" color="#ff9800" sx={{ display: 'block', mb: 1 }}>
                      Bottlenecks ({aiBottleneckCount})
                    </Typography>
                    {aiInsights.bottlenecks.slice(0, 2).map((bottleneck, index) => (
                      <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: 'rgba(255, 152, 0, 0.1)', borderRadius: 1 }}>
                        <Typography variant="caption">
                          ⚠️ {bottleneck}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                
                {totalAICount === 0 && (
                  <Typography color="text.secondary" align="center" py={2}>
                    Enable AI for intelligent insights
                  </Typography>
                )}
                
                {aiInsights?.timestamp && (
                  <Typography variant="caption" color="#673ab7" sx={{ mt: 2, display: 'block' }}>
                    Last AI analysis: {getLastAnalysisText()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default AlertsPanel;