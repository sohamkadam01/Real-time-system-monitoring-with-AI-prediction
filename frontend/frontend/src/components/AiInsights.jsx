// google gemini step 4 from deepseek

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Rating,
} from '@mui/material';
import {
  Insights as InsightsIcon,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  Build as BuildIcon,
  TrendingUp as TrendingUpIcon,
  HealthAndSafety as HealthIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useWebSocket } from '../services/websocket';

const AiInsights = () => {
  const { aiInsights, analyzing } = useWebSocket();

  if (!aiInsights) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <PsychologyIcon sx={{ mr: 1, color: '#666' }} />
          <Typography variant="h6">AI System Analysis</Typography>
          <Chip label="Disabled" size="small" sx={{ ml: 2 }} />
        </Box>
        <Typography color="text.secondary">
          Enable Google Gemini API for intelligent system analysis and predictive alerts.
        </Typography>
      </Paper>
    );
  }

  const { 
    enabled, 
    healthScore, 
    insights = [], 
    recommendations = [], 
    predictions = [], 
    bottlenecks = [],
    summary,
    timestamp,
    error 
  } = aiInsights;

  if (!enabled) {
    return (
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
        <Typography variant="h6" gutterBottom>
          <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          AI Analysis Disabled
        </Typography>
        <Alert severity="info">
          Set up Google Gemini API to enable intelligent monitoring.
          Add VITE_GEMINI_API_KEY to your .env file.
        </Alert>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom color="error">
          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          AI Analysis Error
        </Typography>
        <Typography color="text.secondary">{error}</Typography>
      </Paper>
    );
  }

  const getHealthColor = (score) => {
    if (score >= 8) return '#4caf50';
    if (score >= 6) return '#ff9800';
    return '#f44336';
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center">
          <PsychologyIcon sx={{ mr: 1, color: '#673ab7' }} />
          <Typography variant="h6">AI System Analysis</Typography>
          {analyzing && (
            <Chip 
              label="Analyzing..." 
              size="small" 
              color="primary"
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        
        <Box display="flex" alignItems="center">
          <Rating 
            value={healthScore / 2} 
            max={5} 
            readOnly 
            precision={0.5}
            sx={{ mr: 2 }}
          />
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            backgroundColor: getHealthColor(healthScore),
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            {healthScore}
          </Box>
        </Box>
      </Box>

      {summary && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Summary:</strong> {summary}
        </Alert>
      )}

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center">
            <InsightsIcon sx={{ mr: 1, color: '#2196f3' }} />
            <Typography>Key Insights</Typography>
            <Chip label={insights.length} size="small" sx={{ ml: 2 }} />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {insights.map((insight, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <InsightsIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary={insight} />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {recommendations.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <BuildIcon sx={{ mr: 1, color: '#4caf50' }} />
              <Typography>Optimization Recommendations</Typography>
              <Chip label={recommendations.length} size="small" sx={{ ml: 2 }} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {recommendations.map((rec, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <BuildIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary={rec} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {predictions.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <TrendingUpIcon sx={{ mr: 1, color: '#ff9800' }} />
              <Typography>Predictions (Next 1 Hour)</Typography>
              <Chip label={predictions.length} size="small" sx={{ ml: 2 }} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {predictions.map((pred, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <TrendingUpIcon fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={pred} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {bottlenecks.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <WarningIcon sx={{ mr: 1, color: '#f44336' }} />
              <Typography>Potential Bottlenecks</Typography>
              <Chip label={bottlenecks.length} size="small" sx={{ ml: 2 }} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {bottlenecks.map((bottleneck, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <WarningIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText primary={bottleneck} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {timestamp && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Last analysis: {new Date(timestamp).toLocaleTimeString()}
        </Typography>
      )}
    </Paper>
  );
};

export default AiInsights;