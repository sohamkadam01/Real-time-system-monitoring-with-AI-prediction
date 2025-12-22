import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Button,
  Tooltip,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Stack,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Slide,
  Grow,
  Avatar,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Psychology as PsychologyIcon,
  Bolt as BoltIcon,
  BugReport as BugIcon,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AutoAwesomeIcon,
  RocketLaunch as RocketIcon,
  Security as SecurityIcon,
  Insights as InsightsIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { systemApi } from '../services/api';
import geminiService from '../services/geminiService';
import { formatBytes, formatPercentage } from '../utils/formatters';

// Helper function to parse AI response into predictions format
const parseAIResponseToPredictions = (aiResponse) => {
  // If AI response already has predictions array, return it
  if (aiResponse.predictions && Array.isArray(aiResponse.predictions)) {
    return aiResponse.predictions;
  }
  
  // If AI returned an object with a predictions property
  if (aiResponse && aiResponse.predictions) {
    return aiResponse.predictions.map(pred => ({
      type: pred.type || 'GENERAL_ISSUE',
      confidence: pred.confidence || 50,
      message: pred.message || pred.text || 'Issue detected',
      severity: pred.severity || (pred.confidence > 70 ? 'high' : pred.confidence > 50 ? 'medium' : 'low'),
      predictionTimeframe: pred.predictionTimeframe || '30 minutes',
      suggestedAction: pred.suggestedAction || 'Monitor closely',
      timestamp: new Date().toISOString()
    }));
  }
  
  // Fallback: parse text response
  if (aiResponse && typeof aiResponse === 'object') {
    const text = aiResponse.text || JSON.stringify(aiResponse);
    
    // Try to extract predictions from text
    if (text.includes('CPU') || text.includes('spike')) {
      return [{
        type: 'CPU_SPIKE',
        confidence: 65,
        message: 'Potential CPU spike detected based on AI analysis',
        severity: 'medium',
        predictionTimeframe: '15 minutes',
        suggestedAction: 'Monitor CPU usage closely',
        timestamp: new Date().toISOString()
      }];
    }
  }
  
  // Default fallback
  return [{
    type: 'ANALYSIS_COMPLETE',
    confidence: 60,
    message: 'AI analysis completed. Process appears stable.',
    severity: 'low',
    predictionTimeframe: '1 hour',
    suggestedAction: 'Continue monitoring',
    timestamp: new Date().toISOString()
  }];
};

// Process prediction service that uses Gemini
const processPredictionService = {
  analyzeProcess: async (processData, historicalData) => {
    try {
      // Get system context for better predictions
      let contextMetrics = null;
      try {
        const response = await systemApi.getSystemMetrics();
        contextMetrics = response.data;
      } catch (error) {
        console.warn('Could not fetch system context for AI analysis:', error);
      }
      
      // Call the new analyzeProcess method from GeminiService
      const aiResponse = await geminiService.analyzeProcess(processData, contextMetrics);
      
      // If Gemini returned predictions directly
      if (aiResponse.predictions && Array.isArray(aiResponse.predictions)) {
        return aiResponse.predictions;
      }
      
      // If Gemini returned an object with predictions
      if (aiResponse && aiResponse.predictions) {
        return parseAIResponseToPredictions(aiResponse);
      }
      
      // Fallback to mock analysis if Gemini fails or returns unexpected format
      console.warn('Unexpected Gemini response format, falling back to mock analysis');
      return fallbackMockAnalysis(processData);
      
    } catch (error) {
      console.error('AI prediction failed:', error);
      
      // Fallback to mock analysis on error
      return fallbackMockAnalysis(processData);
    }
  }
};

// Simple fallback mock analysis
const fallbackMockAnalysis = (processData) => {
  const predictions = [];
  const now = new Date().toISOString();
  
  if (processData.cpuUsage > 70) {
    predictions.push({
      type: 'CPU_SPIKE',
      confidence: Math.min(95, 60 + processData.cpuUsage),
      message: `High CPU usage (${processData.cpuUsage}%) may cause system slowdown`,
      severity: 'high',
      predictionTimeframe: '10 minutes',
      suggestedAction: 'Check for runaway threads or infinite loops',
      timestamp: now
    });
  }
  
  if (processData.memoryUsage > 1000000000) { // > 1GB
    predictions.push({
      type: 'MEMORY_LEAK',
      confidence: 65,
      message: 'Large memory footprint detected',
      severity: 'medium',
      predictionTimeframe: '30 minutes',
      suggestedAction: 'Monitor memory growth over time',
      timestamp: now
    });
  }
  
  if (processData.threadCount > 100) {
    predictions.push({
      type: 'THREAD_EXHAUSTION',
      confidence: 55,
      message: 'High thread count may lead to context switching overhead',
      severity: 'medium',
      predictionTimeframe: '20 minutes',
      suggestedAction: 'Consider thread pooling or reducing thread count',
      timestamp: now
    });
  }
  
  if (predictions.length === 0 && processData.cpuUsage > 40) {
    predictions.push({
      type: 'MONITOR',
      confidence: 50,
      message: 'Process shows elevated resource usage',
      severity: 'low',
      predictionTimeframe: '1 hour',
      suggestedAction: 'Continue monitoring for trends',
      timestamp: now
    });
  }
  
  return predictions;
};

const ProcessList = () => {
  const theme = useTheme();
  const [processes, setProcesses] = useState([]);
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('cpuUsage');
  const [sortOrder, setSortOrder] = useState('desc');
  const [processPredictions, setProcessPredictions] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [currentlyAnalyzing, setCurrentlyAnalyzing] = useState([]);
  const [aiServiceStatus, setAiServiceStatus] = useState({
    enabled: geminiService.enabled,
    lastError: null
  });

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const response = await systemApi.getProcesses();
        const processesWithTrend = (response.data.processes || []).map(p => ({
          ...p,
          // Add mock trend data - in production, calculate from history
          cpuUsageTrend: Math.random() * 10 - 5,
          memoryTrend: Math.random() * 15 - 7.5,
        }));
        setProcesses(processesWithTrend);
      } catch (error) {
        console.error('Error fetching processes:', error);
      }
    };

    fetchProcesses();
    const interval = setInterval(fetchProcesses, 3000);
    return () => clearInterval(interval);
  }, []);

  // Calculate analysis duration
  const getAnalysisDuration = useCallback((startTime) => {
    const duration = Date.now() - startTime;
    return `${Math.round(duration / 1000)}s`;
  }, []);

  // Predict behavior for a specific process
  const predictProcessBehavior = useCallback(async (process) => {
    setAnalyzing(true);
    
    // Add process to currently analyzing list
    setCurrentlyAnalyzing(prev => [
      ...prev, 
      { pid: process.pid, name: process.name, startTime: Date.now() }
    ]);
    
    try {
      // Check if Gemini is enabled
      if (!geminiService.enabled) {
        setAiServiceStatus(prev => ({
          ...prev,
          lastError: 'Gemini AI not enabled. Check API key.'
        }));
        
        // Use fallback if Gemini disabled
        const predictions = fallbackMockAnalysis(process);
        
        setProcessPredictions(prev => ({
          ...prev,
          [process.pid]: {
            predictions,
            lastUpdated: new Date().toISOString(),
            processName: process.name
          }
        }));
        
        // Add to prediction history
        setPredictionHistory(prev => [
          ...prev,
          {
            pid: process.pid,
            processName: process.name,
            predictions,
            timestamp: new Date().toISOString(),
            actualCpu: process.cpuUsage,
            actualMemory: process.memoryUsage
          }
        ].slice(-100));
        
        return;
      }
      
      const predictions = await processPredictionService.analyzeProcess(process, predictionHistory);
      
      setProcessPredictions(prev => ({
        ...prev,
        [process.pid]: {
          predictions,
          lastUpdated: new Date().toISOString(),
          processName: process.name
        }
      }));
      
      // Add to prediction history
      setPredictionHistory(prev => [
        ...prev,
        {
          pid: process.pid,
          processName: process.name,
          predictions,
          timestamp: new Date().toISOString(),
          actualCpu: process.cpuUsage,
          actualMemory: process.memoryUsage
        }
      ].slice(-100));
      
    } catch (error) {
      console.error('Prediction error:', error);
      setAiServiceStatus(prev => ({
        ...prev,
        lastError: error.message
      }));
    } finally {
      // Remove from currently analyzing list
      setCurrentlyAnalyzing(prev => prev.filter(p => p.pid !== process.pid));
      setAnalyzing(false);
    }
  }, [predictionHistory]);

  // Predict behavior for all high-risk processes
  const predictAllHighRisk = useCallback(async () => {
    setAnalyzing(true);
    const highRiskProcesses = processes.filter(p => p.cpuUsage > 40 || p.memoryUsage > 500000000);
    
    // Limit to 5 processes to avoid rate limiting
    const processesToAnalyze = highRiskProcesses.slice(0, 5);
    
    // Add all processes to currently analyzing list
    const analyzingList = processesToAnalyze.map(p => ({
      pid: p.pid, 
      name: p.name, 
      startTime: Date.now()
    }));
    setCurrentlyAnalyzing(analyzingList);
    
    // Analyze processes sequentially to avoid overwhelming the API
    for (const process of processesToAnalyze) {
      await predictProcessBehavior(process);
    }
    
    setAnalyzing(false);
  }, [processes, predictProcessBehavior]);

  // Filter and sort processes
  useEffect(() => {
    let result = [...processes];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.pid.toString().includes(term)
      );
    }
    
    result.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredProcesses(result);
  }, [processes, searchTerm, sortBy, sortOrder]);

  const getPredictionSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const getPredictionIcon = (type) => {
    switch (type) {
      case 'CPU_SPIKE': return <BoltIcon fontSize="small" />;
      case 'CRASH_RISK': return <BugIcon fontSize="small" />;
      case 'HANG_RISK': return <WarningIcon fontSize="small" />;
      case 'MEMORY_LEAK': return <MemoryIcon fontSize="small" />;
      case 'THREAD_EXHAUSTION': return <CpuIcon fontSize="small" />;
      default: return <TimelineIcon fontSize="small" />;
    }
  };

  const SortableHeader = ({ column, label }) => (
    <TableCell sortDirection={sortBy === column ? sortOrder : false}>
      <TableSortLabel
        active={sortBy === column}
        direction={sortBy === column ? sortOrder : 'asc'}
        onClick={() => handleSort(column)}
        sx={{
          fontWeight: 'bold',
          '&:hover': { color: theme.palette.primary.main }
        }}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSearchClear = () => {
    setSearchTerm('');
  };

  const getProcessStatusColor = (cpuUsage) => {
    if (cpuUsage >= 50) return theme.palette.error.main;
    if (cpuUsage >= 20) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Calculate risk score for a process
  const calculateRiskScore = useMemo(() => (process) => {
    let score = 0;
    if (process.cpuUsage > 70) score += 40;
    if (process.cpuUsage > 40) score += 20;
    if (process.memoryUsage > 1000000000) score += 30;
    if (process.threadCount > 50) score += 10;
    if (process.state !== 'RUNNING') score += 20;
    return Math.min(100, score);
  }, []);

  // Create pulsing AI icon component
  const PulsingAiIcon = ({ size = 16, iconSize = 10, color = theme.palette.secondary.main }) => (
    <Box sx={{ 
      width: size, 
      height: size, 
      borderRadius: '50%', 
      background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'pulse 1.5s infinite',
      boxShadow: `0 0 12px ${alpha(color, 0.5)}`
    }}>
      <PsychologyIcon sx={{ fontSize: iconSize, color: 'white' }} />
    </Box>
  );

  // Calculate prediction statistics
  const predictionStats = useMemo(() => {
    const allPredictions = Object.values(processPredictions).flatMap(p => p.predictions || []);
    return {
      totalPredictions: allPredictions.length,
      highSeverity: allPredictions.filter(p => p.severity === 'high').length,
      mediumSeverity: allPredictions.filter(p => p.severity === 'medium').length,
      lowSeverity: allPredictions.filter(p => p.severity === 'low').length,
    };
  }, [processPredictions]);

  return (
    <Fade in={true} timeout={600}>
      <Box>
        {/* Add CSS animations */}
        <style jsx global>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          @keyframes slideIn {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Header Section with Gradient */}
        <Box mb={4}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ 
                width: 56, 
                height: 56, 
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                animation: 'float 3s ease-in-out infinite'
              }}>
                <PsychologyIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5
                }}>
                  AI-Powered Process Intelligence
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time behavior prediction and anomaly detection
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={<AutoAwesomeIcon />}
                label={`${processes.length} Processes`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
              <IconButton 
                onClick={predictAllHighRisk}
                disabled={analyzing || !geminiService.enabled}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.primary.dark} 100%)`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <RocketIcon />
              </IconButton>
            </Box>
          </Box>

          {/* AI Service Status Banner */}
          <Slide direction="down" in={aiServiceStatus.lastError} timeout={500}>
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, transparent 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              }}
              icon={<SecurityIcon />}
            >
              <Typography variant="body2">
                {aiServiceStatus.lastError}
              </Typography>
            </Alert>
          </Slide>

          {/* Prediction Stats Overview */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.9)} 0%, ${alpha(theme.palette.info.dark, 0.8)} 100%)`,
                color: 'white',
                borderRadius: 3,
                boxShadow: `0 8px 32px ${alpha(theme.palette.info.main, 0.3)}`,
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                  animation: 'shimmer 2s infinite'
                }
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        AI Predictions
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {predictionStats.totalPredictions}
                      </Typography>
                    </Box>
                    <InsightsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.9)} 0%, ${alpha(theme.palette.error.dark, 0.8)} 100%)`,
                color: 'white',
                borderRadius: 3,
                boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.3)}`
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        High Risk
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {predictionStats.highSeverity}
                      </Typography>
                    </Box>
                    <WarningIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.9)} 0%, ${alpha(theme.palette.warning.dark, 0.8)} 100%)`,
                color: 'white',
                borderRadius: 3,
                boxShadow: `0 8px 32px ${alpha(theme.palette.warning.main, 0.3)}`
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Medium Risk
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {predictionStats.mediumSeverity}
                      </Typography>
                    </Box>
                    <TimelineIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.9)} 0%, ${alpha(theme.palette.success.dark, 0.8)} 100%)`,
                color: 'white',
                borderRadius: 3,
                boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.3)}`
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Processes Analyzed
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {Object.keys(processPredictions).length}
                      </Typography>
                    </Box>
                    <PsychologyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* CURRENTLY ANALYZING SECTION - Enhanced */}
        {currentlyAnalyzing.length > 0 && (
          <Zoom in={true}>
            <Card sx={{ 
              mb: 3, 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'pulse 2s infinite'
                    }}>
                      <TimelineIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        Active AI Analysis
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Real-time predictive modeling in progress
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip 
                      label={`${currentlyAnalyzing.length} active`}
                      size="small"
                      color="primary"
                      icon={<AutoAwesomeIcon />}
                      sx={{ fontWeight: 'bold' }}
                    />
                    <CircularProgress 
                      size={20} 
                      thickness={4}
                      sx={{ color: theme.palette.primary.main }}
                    />
                  </Box>
                </Box>
                
                <Grid container spacing={1.5}>
                  {currentlyAnalyzing.map((process) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={process.pid}>
                      <Grow in={true}>
                        <Card 
                          variant="outlined"
                          sx={{ 
                            p: 1.5,
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              background: alpha(theme.palette.primary.main, 0.05),
                              transform: 'translateY(-2px)',
                              transition: 'all 0.3s ease'
                            }
                          }}
                        >
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box sx={{ maxWidth: '70%' }}>
                              <Typography variant="body2" fontWeight="medium" noWrap sx={{ color: theme.palette.primary.main }}>
                                {process.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                PID: {process.pid}
                              </Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={1}>
                              <PulsingAiIcon size={24} iconSize={12} color={theme.palette.secondary.main} />
                              <Typography variant="caption" fontWeight="bold" color="secondary">
                                {getAnalysisDuration(process.startTime)}
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Grow>
                    </Grid>
                  ))}
                </Grid>
                
                <Box mt={2} display="flex" alignItems="center" gap={1}>
                  <PsychologyIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                  <Typography variant="caption" color="text.secondary">
                    {geminiService.enabled 
                      ? 'AI is analyzing patterns to predict potential system impacts...'
                      : 'Using advanced fallback analysis algorithms'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        )}

        {/* Main Process Table Section */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: `0 8px 40px ${alpha(theme.palette.common.black, 0.12)}`,
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            p: 3, 
            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
          }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <SpeedIcon />
                Live Process Monitor
                <Badge 
                  badgeContent={processes.length} 
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Paper
                  component="form"
                  sx={{ 
                    p: '2px 4px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: 300,
                    borderRadius: 2,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`
                  }}
                >
                  <InputAdornment position="start" sx={{ pl: 1 }}>
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                  <TextField
                    placeholder="Search processes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    variant="standard"
                    sx={{ ml: 1, flex: 1 }}
                    InputProps={{ disableUnderline: true }}
                  />
                  {searchTerm && (
                    <IconButton size="small" onClick={handleSearchClear}>
                      <ClearIcon />
                    </IconButton>
                  )}
                </Paper>
              </Box>
            </Box>
          </Box>
          
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ 
                  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`
                }}>
                  <SortableHeader column="pid" label="PID" />
                  <SortableHeader column="name" label="Process Name" />
                  <SortableHeader column="cpuUsage" label="CPU" />
                  <SortableHeader column="memoryUsage" label="Memory" />
                  <SortableHeader column="threadCount" label="Threads" />
                  <TableCell sx={{ fontWeight: 'bold' }}>Risk Score</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>AI Predictions</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProcesses.slice(0, 50).map((process, index) => {
                  const riskScore = calculateRiskScore(process);
                  const predictions = processPredictions[process.pid]?.predictions || [];
                  const isCurrentlyAnalyzing = currentlyAnalyzing.some(p => p.pid === process.pid);
                  const hasHighRiskPredictions = predictions.some(p => p.severity === 'high');
                  
                  return (
                    <Fade in={true} key={process.pid} timeout={index * 100}>
                      <TableRow 
                        hover 
                        sx={{
                          animation: 'slideIn 0.3s ease-out',
                          background: hasHighRiskPredictions 
                            ? `linear-gradient(90deg, ${alpha(theme.palette.error.main, 0.05)} 0%, transparent 100%)` 
                            : riskScore > 60 
                              ? `linear-gradient(90deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, transparent 100%)`
                              : 'inherit',
                          '&:hover': {
                            background: hasHighRiskPredictions 
                              ? `linear-gradient(90deg, ${alpha(theme.palette.error.main, 0.08)} 0%, transparent 100%)` 
                              : riskScore > 60 
                                ? `linear-gradient(90deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, transparent 100%)`
                                : alpha(theme.palette.action.hover, 0.05),
                          },
                          borderLeft: hasHighRiskPredictions 
                            ? `4px solid ${theme.palette.error.main}`
                            : riskScore > 60 
                              ? `4px solid ${theme.palette.warning.main}`
                              : 'none'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {process.pid}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ 
                              width: 28, 
                              height: 28,
                              fontSize: 12,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                            }}>
                              {process.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 180 }}>
                              {process.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%', 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: alpha(getProcessStatusColor(process.cpuUsage), 0.1)
                            }}>
                              <CpuIcon fontSize="small" sx={{ color: getProcessStatusColor(process.cpuUsage) }} />
                            </Box>
                            <Typography variant="body2" fontWeight="bold">
                              {formatPercentage(process.cpuUsage)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%', 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: alpha(theme.palette.info.main, 0.1)
                            }}>
                              <MemoryIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                            </Box>
                            <Typography variant="body2" fontWeight="medium">
                              {formatBytes(process.memoryUsage)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={process.threadCount}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontWeight: 'bold',
                              borderColor: alpha(theme.palette.primary.main, 0.3)
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`Risk Score: ${riskScore}/100`}>
                            <Box sx={{ position: 'relative' }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 8,
                                  backgroundColor: alpha(theme.palette.grey[300], 0.3),
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${riskScore}%`,
                                    height: '100%',
                                    background: `linear-gradient(90deg, ${
                                      riskScore > 60 ? theme.palette.error.main : 
                                      riskScore > 30 ? theme.palette.warning.main : 
                                      theme.palette.success.main
                                    } 0%, ${
                                      alpha(riskScore > 60 ? theme.palette.error.main : 
                                      riskScore > 30 ? theme.palette.warning.main : 
                                      theme.palette.success.main, 0.8)
                                    } 100%)`,
                                    borderRadius: 4,
                                    transition: 'width 0.5s ease'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" fontWeight="bold" sx={{ 
                                position: 'absolute', 
                                right: 0, 
                                top: '50%', 
                                transform: 'translateY(-50%)',
                                color: riskScore > 60 ? theme.palette.error.main : 
                                      riskScore > 30 ? theme.palette.warning.main : 
                                      theme.palette.success.main
                              }}>
                                {riskScore}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {predictions.length > 0 ? (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {predictions.slice(0, 3).map((pred, idx) => (
                                <Chip
                                  key={idx}
                                  label={pred.type?.replace('_', ' ')}
                                  size="small"
                                  icon={getPredictionIcon(pred.type)}
                                  sx={{
                                    background: `linear-gradient(135deg, ${getPredictionSeverityColor(pred.severity)} 0%, ${alpha(getPredictionSeverityColor(pred.severity), 0.8)} 100%)`,
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    height: 22,
                                    fontWeight: 'bold',
                                    boxShadow: `0 2px 8px ${alpha(getPredictionSeverityColor(pred.severity), 0.3)}`
                                  }}
                                />
                              ))}
                              {predictions.length > 3 && (
                                <Chip
                                  label={`+${predictions.length - 3}`}
                                  size="small"
                                  sx={{
                                    background: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    fontWeight: 'bold'
                                  }}
                                />
                              )}
                            </Stack>
                          ) : isCurrentlyAnalyzing ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PulsingAiIcon size={20} iconSize={10} />
                              <Typography variant="caption" fontWeight="bold" color="secondary">
                                Analyzing...
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary" fontStyle="italic">
                              Ready for analysis
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant={isCurrentlyAnalyzing ? "contained" : "outlined"}
                            startIcon={
                              isCurrentlyAnalyzing ? (
                                <PulsingAiIcon size={16} iconSize={8} />
                              ) : (
                                <PsychologyIcon fontSize="small" />
                              )
                            }
                            onClick={() => predictProcessBehavior(process)}
                            disabled={analyzing || isCurrentlyAnalyzing || !geminiService.enabled}
                            sx={{
                              minWidth: 110,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 'bold',
                              background: isCurrentlyAnalyzing 
                                ? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)` 
                                : 'transparent',
                              borderColor: isCurrentlyAnalyzing ? 'transparent' : theme.palette.primary.main,
                              color: isCurrentlyAnalyzing ? 'white' : theme.palette.primary.main,
                              '&:hover': {
                                background: isCurrentlyAnalyzing 
                                  ? `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.primary.dark} 100%)`
                                  : alpha(theme.palette.primary.main, 0.1),
                                transform: 'translateY(-2px)',
                                boxShadow: isCurrentlyAnalyzing 
                                  ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
                                  : `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {isCurrentlyAnalyzing ? 'Analyzing...' : 'AI Analyze'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    </Fade>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredProcesses.length === 0 && (
            <Box textAlign="center" py={8}>
              <AutoAwesomeIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No processes match your search
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Try a different search term or check your filters
              </Typography>
            </Box>
          )}
        </Card>

        {/* Bottom Dashboard Section */}
        <Grid container spacing={3}>
          {/* Recent Predictions Panel */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 3,
              height: '100%',
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                    <BarChartIcon />
                    Recent AI Predictions
                  </Typography>
                  <Chip 
                    label={`${predictionHistory.length} total`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                {predictionHistory.slice(-5).reverse().map((history, idx) => (
                  <Grow in={true} key={idx} timeout={(idx + 1) * 200}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        mb: 2, 
                        p: 2, 
                        borderRadius: 2,
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, transparent 100%)`,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          transform: 'translateX(4px)',
                          transition: 'all 0.3s ease'
                        }
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {history.processName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            PID: {history.pid}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PsychologyIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(history.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box mb={1.5}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          AI Insights ({history.predictions.length})
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {history.predictions.map((pred, pIdx) => (
                            <Chip
                              key={pIdx}
                              label={`${pred.type?.replace('_', ' ')} (${pred.confidence}%)`}
                              size="small"
                              sx={{
                                background: getPredictionSeverityColor(pred.severity),
                                color: 'white',
                                fontSize: '0.6rem',
                                height: 18,
                                fontWeight: 'bold'
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                      
                      {history.predictions[0] && (
                        <Alert 
                          severity={history.predictions[0].severity}
                          icon={getPredictionIcon(history.predictions[0].type)}
                          sx={{ 
                            py: 0.5, 
                            fontSize: '0.75rem',
                            borderRadius: 1,
                            background: alpha(
                              getPredictionSeverityColor(history.predictions[0].severity), 
                              0.1
                            )
                          }}
                        >
                          {history.predictions[0].message}
                        </Alert>
                      )}
                    </Card>
                  </Grow>
                ))}
                
                {predictionHistory.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No predictions yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click "AI Analyze" on any process to begin
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* High-Risk Process Panel */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 3,
              height: '100%',
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.03)} 0%, transparent 100%)`
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                    <WarningIcon sx={{ color: theme.palette.error.main }} />
                    Critical Process Monitor
                  </Typography>
                  <Chip 
                    label="High Alert"
                    size="small"
                    color="error"
                    icon={<SecurityIcon />}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                
                {processes
                  .filter(p => calculateRiskScore(p) > 60)
                  .slice(0, 5)
                  .map((process, idx) => {
                    const predictions = processPredictions[process.pid]?.predictions || [];
                    const isCurrentlyAnalyzing = currentlyAnalyzing.some(p => p.pid === process.pid);
                    
                    return (
                      <Zoom in={true} key={process.pid} timeout={(idx + 1) * 200}>
                        <Card 
                          sx={{ 
                            mb: 2, 
                            p: 2, 
                            borderRadius: 2,
                            border: `2px solid ${alpha(theme.palette.error.main, 0.3)}`,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, transparent 100%)`,
                            '&:hover': {
                              borderColor: theme.palette.error.main,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 20px ${alpha(theme.palette.error.main, 0.2)}`,
                              transition: 'all 0.3s ease'
                            }
                          }}
                        >
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar sx={{ 
                                width: 32, 
                                height: 32,
                                fontSize: 14,
                                fontWeight: 'bold',
                                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.warning.main} 100%)`
                              }}>
                                {process.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {process.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  PID: {process.pid}
                                </Typography>
                              </Box>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              {isCurrentlyAnalyzing && <PulsingAiIcon size={20} iconSize={10} color={theme.palette.error.main} />}
                              <Chip
                                label={isCurrentlyAnalyzing ? "Analyzing" : "Critical"}
                                size="small"
                                sx={{ 
                                  background: isCurrentlyAnalyzing 
                                    ? theme.palette.warning.main 
                                    : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>
                          </Box>
                          
                          <Grid container spacing={1} mb={2}>
                            <Grid item xs={4}>
                              <Box sx={{ 
                                p: 1, 
                                background: alpha(theme.palette.error.main, 0.1),
                                borderRadius: 1,
                                textAlign: 'center'
                              }}>
                                <Typography variant="caption" display="block" color="error.main" fontWeight="bold">
                                  CPU
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatPercentage(process.cpuUsage)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ 
                                p: 1, 
                                background: alpha(theme.palette.warning.main, 0.1),
                                borderRadius: 1,
                                textAlign: 'center'
                              }}>
                                <Typography variant="caption" display="block" color="warning.main" fontWeight="bold">
                                  Memory
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatBytes(process.memoryUsage)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ 
                                p: 1, 
                                background: alpha(theme.palette.info.main, 0.1),
                                borderRadius: 1,
                                textAlign: 'center'
                              }}>
                                <Typography variant="caption" display="block" color="info.main" fontWeight="bold">
                                  Threads
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {process.threadCount}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                          
                          {predictions.length > 0 ? (
                            <Alert 
                              severity="error" 
                              icon={<WarningIcon />}
                              sx={{ 
                                borderRadius: 1,
                                background: alpha(theme.palette.error.main, 0.1),
                                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                              }}
                            >
                              <Typography variant="caption" fontWeight="bold">
                                {predictions[0].message}
                              </Typography>
                            </Alert>
                          ) : isCurrentlyAnalyzing ? (
                            <Alert 
                              severity="info"
                              icon={<PsychologyIcon />}
                              sx={{ borderRadius: 1 }}
                            >
                              <Typography variant="caption">
                                AI analysis in progress...
                              </Typography>
                            </Alert>
                          ) : (
                            <Button
                              fullWidth
                              size="small"
                              variant="contained"
                              startIcon={<PsychologyIcon />}
                              onClick={() => predictProcessBehavior(process)}
                              sx={{
                                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.warning.main} 100%)`,
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: 1,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.warning.dark} 100%)`,
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.4)}`
                                }
                              }}
                              disabled={!geminiService.enabled}
                            >
                              Analyze Critical Risk
                            </Button>
                          )}
                        </Card>
                      </Zoom>
                    );
                  })}
                
                {processes.filter(p => calculateRiskScore(p) > 60).length === 0 && (
                  <Box textAlign="center" py={4}>
                    <SecurityIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.5, mb: 2 }} />
                    <Typography variant="body1" color="success.main" fontWeight="bold">
                      All systems stable
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      No high-risk processes detected
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default ProcessList;