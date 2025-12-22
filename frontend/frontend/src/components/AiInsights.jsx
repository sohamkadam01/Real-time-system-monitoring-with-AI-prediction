import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Rating,
  Divider,
} from '@mui/material';
import {
  Psychology,
  Insights,
  Build,
  TrendingUp,
  Warning,
  ExpandMore,
  HealthAndSafety,
} from '@mui/icons-material';
import { useWebSocket } from '../services/websocket';

const AiInsights = () => {
  const { aiInsights, analyzing } = useWebSocket();

  // 🔹 No AI data
  if (!aiInsights) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">
          <Psychology sx={{ mr: 1 }} />
          AI Insights
        </Typography>
        <Typography color="text.secondary">
          AI analysis is currently unavailable.
        </Typography>
      </Paper>
    );
  }

  const {
    enabled,
    healthScore = 0,
    summary,
    insights = [],
    recommendations = [],
    predictions = [],
    bottlenecks = [],
    timestamp,
    error,
  } = aiInsights;

  // 🔹 AI disabled
  if (!enabled) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          Enable Google Gemini API to unlock AI-based system insights.
        </Alert>
      </Paper>
    );
  }

  // 🔹 AI error
  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  const healthLabel =
    healthScore >= 8 ? 'Excellent' :
    healthScore >= 6 ? 'Stable' :
    'Critical';

  return (
    <Paper sx={{ p: 3 }}>
      {/* ================= HEADER ================= */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h6">
            <Psychology sx={{ mr: 1, color: '#673ab7' }} />
            AI System Insights
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Real-time AI understanding of your system
          </Typography>
        </Box>

        <Box textAlign="center">
          <Rating value={healthScore / 2} readOnly precision={0.5} />
          <Chip
            label={`${healthLabel} (${healthScore}/10)`}
            color={
              healthScore >= 8 ? 'success' :
              healthScore >= 6 ? 'warning' : 'error'
            }
            size="small"
          />
        </Box>
      </Box>

      {analyzing && (
        <Chip
          label="AI analyzing..."
          color="primary"
          size="small"
          sx={{ mt: 1 }}
        />
      )}

      <Divider sx={{ my: 2 }} />

      {/* ================= SUMMARY ================= */}
      {summary && (
        <Alert severity="info" icon={<HealthAndSafety />}>
          <strong>AI Summary:</strong> {summary}
        </Alert>
      )}

      {/* ================= INSIGHTS ================= */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Insights sx={{ mr: 1 }} />
          <Typography>Key Observations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {insights.map((item, i) => (
              <ListItem key={i}>
                <ListItemIcon>
                  <Insights color="primary" />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* ================= RECOMMENDATIONS ================= */}
      {recommendations.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Build sx={{ mr: 1, color: '#4caf50' }} />
            <Typography>Recommended Actions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {recommendations.map((item, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    <Build color="success" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* ================= PREDICTIONS ================= */}
      {predictions.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <TrendingUp sx={{ mr: 1, color: '#ff9800' }} />
            <Typography>What May Happen Soon</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {predictions.map((item, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    <TrendingUp color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* ================= BOTTLENECKS ================= */}
      {bottlenecks.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Warning sx={{ mr: 1, color: '#f44336' }} />
            <Typography>Risk Areas</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {bottlenecks.map((item, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    <Warning color="error" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* ================= FOOTER ================= */}
      {timestamp && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          Last AI update: {new Date(timestamp).toLocaleTimeString()}
        </Typography>
      )}
    </Paper>
  );
};

export default AiInsights;
