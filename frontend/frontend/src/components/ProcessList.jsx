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
      case 'high': return '#ff4444';
      case 'medium': return '#ffbb33';
      case 'low': return '#4caf50';
      default: return '#757575';
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
    if (cpuUsage >= 50) return '#ff4444';
    if (cpuUsage >= 20) return '#ffbb33';
    return '#00C851';
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
  const PulsingAiIcon = ({ size = 16, iconSize = 10 }) => (
    <Box sx={{ 
      width: size, 
      height: size, 
      borderRadius: '50%', 
      backgroundColor: '#2196f3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'pulse 1.5s infinite'
    }}>
      <PsychologyIcon sx={{ fontSize: iconSize, color: 'white' }} />
    </Box>
  );

  return (
    <Box>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <Typography variant="h4" gutterBottom>
        Process List with AI Predictions
      </Typography>
      
      {/* AI Service Status Alert */}
      {aiServiceStatus.lastError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {aiServiceStatus.lastError}
        </Alert>
      )}
      
      {/* AI Prediction Controls */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'rgba(103, 58, 183, 0.1)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <PsychologyIcon color="secondary" />
            <Box>
              <Typography variant="h6">
                AI Process Behavior Predictions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {geminiService.enabled 
                  ? 'Predict CPU spikes, crashes, and hangs before they happen'
                  : 'Gemini AI disabled. Check API key configuration.'}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PsychologyIcon />}
              onClick={predictAllHighRisk}
              disabled={analyzing || !geminiService.enabled}
              color="secondary"
            >
              {analyzing ? 'Analyzing...' : 'Predict High-Risk'}
            </Button>
          </Box>
        </Box>
        
        {analyzing && (
          <Box mt={2}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Analyzing process patterns...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* CURRENTLY ANALYZING SECTION */}
      {currentlyAnalyzing.length > 0 && (
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: 'rgba(33, 150, 243, 0.1)', 
          border: '1px solid rgba(33, 150, 243, 0.3)',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <TimelineIcon sx={{ color: '#2196f3' }} />
              <Typography variant="h6" sx={{ color: '#2196f3' }}>
                Currently Analyzing
              </Typography>
              <Chip 
                label={`${currentlyAnalyzing.length} process${currentlyAnalyzing.length > 1 ? 'es' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Real-time AI analysis in progress
            </Typography>
          </Box>
          
          <Grid container spacing={1}>
            {currentlyAnalyzing.map((process) => (
              <Grid item xs={12} sm={6} md={4} key={process.pid}>
                <Box sx={{ 
                  p: 1.5, 
                  backgroundColor: 'rgba(33, 150, 243, 0.05)', 
                  borderRadius: 1,
                  border: '1px solid rgba(33, 150, 243, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                  }
                }}>
                  <Box sx={{ maxWidth: '70%' }}>
                    <Typography variant="body2" fontWeight="medium" noWrap>
                      {process.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PID: {process.pid}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <PulsingAiIcon size={20} iconSize={12} />
                    <Typography variant="caption" color="text.secondary" fontWeight="medium">
                      {getAnalysisDuration(process.startTime)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {geminiService.enabled 
              ? 'AI is analyzing process behavior patterns to predict future issues...'
              : 'Using fallback analysis (Gemini AI not enabled)'}
          </Typography>
        </Paper>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Running Processes ({processes.length})
            {Object.keys(processPredictions).length > 0 && (
              <Chip 
                label={`${Object.keys(processPredictions).length} processes analyzed`}
                size="small"
                color="secondary"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          
          <TextField
            placeholder="Search processes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearchClear}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <SortableHeader column="pid" label="PID" />
                <SortableHeader column="name" label="Name" />
                <SortableHeader column="cpuUsage" label="CPU Usage" />
                <SortableHeader column="memoryUsage" label="Memory" />
                <SortableHeader column="threadCount" label="Threads" />
                <TableCell>Risk Score</TableCell>
                <TableCell>AI Predictions</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProcesses.slice(0, 50).map((process) => {
                const riskScore = calculateRiskScore(process);
                const predictions = processPredictions[process.pid]?.predictions || [];
                const isCurrentlyAnalyzing = currentlyAnalyzing.some(p => p.pid === process.pid);
                
                return (
                  <TableRow 
                    key={process.pid} 
                    hover 
                    sx={{
                      backgroundColor: riskScore > 60 ? 'rgba(255, 68, 68, 0.05)' : 
                                      riskScore > 30 ? 'rgba(255, 187, 51, 0.05)' : 'inherit',
                      '&:hover': {
                        backgroundColor: riskScore > 60 ? 'rgba(255, 68, 68, 0.08)' : 
                                        riskScore > 30 ? 'rgba(255, 187, 51, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                  >
                    <TableCell>{process.pid}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {process.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <CpuIcon fontSize="small" sx={{ mr: 1, color: getProcessStatusColor(process.cpuUsage) }} />
                        {formatPercentage(process.cpuUsage)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <MemoryIcon fontSize="small" sx={{ mr: 1 }} />
                        {formatBytes(process.memoryUsage)}
                      </Box>
                    </TableCell>
                    <TableCell>{process.threadCount}</TableCell>
                    <TableCell>
                      <Tooltip title={`Risk Score: ${riskScore}/100`}>
                        <Box
                          sx={{
                            width: 60,
                            height: 8,
                            backgroundColor: '#e0e0e0',
                            borderRadius: 4,
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                        >
                          <Box
                            sx={{
                              width: `${riskScore}%`,
                              height: '100%',
                              backgroundColor: 
                                riskScore > 60 ? '#ff4444' : 
                                riskScore > 30 ? '#ffbb33' : '#00C851',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </Box>
                      </Tooltip>
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        {riskScore}/100
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {predictions.length > 0 ? (
                        <Box>
                          {predictions.slice(0, 2).map((pred, idx) => (
                            <Chip
                              key={idx}
                              label={pred.type?.replace('_', ' ') || 'Prediction'}
                              size="small"
                              icon={getPredictionIcon(pred.type)}
                              sx={{
                                backgroundColor: getPredictionSeverityColor(pred.severity),
                                color: 'white',
                                fontSize: '0.65rem',
                                height: 20,
                                mr: 0.5,
                                mb: 0.5
                              }}
                            />
                          ))}
                          {predictions.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                              +{predictions.length - 2} more
                            </Typography>
                          )}
                        </Box>
                      ) : isCurrentlyAnalyzing ? (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PulsingAiIcon size={16} iconSize={8} />
                          <Typography variant="caption" color="#2196f3" fontWeight="medium">
                            Analyzing...
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Not analyzed
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
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
                          minWidth: 100,
                          backgroundColor: isCurrentlyAnalyzing 
                            ? 'rgba(33, 150, 243, 0.1)' 
                            : 'transparent',
                          borderColor: isCurrentlyAnalyzing ? '#2196f3' : undefined,
                          color: isCurrentlyAnalyzing ? '#2196f3' : undefined,
                          '&:hover': {
                            backgroundColor: isCurrentlyAnalyzing 
                              ? 'rgba(33, 150, 243, 0.15)' 
                              : undefined,
                          }
                        }}
                      >
                        {isCurrentlyAnalyzing ? 'Analyzing...' : 'Analyze'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredProcesses.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              No processes found matching your search
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Prediction History & Analysis */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Predictions
            </Typography>
            {predictionHistory.slice(-5).reverse().map((history, idx) => (
              <Box key={idx} sx={{ mb: 1.5, p: 1.5, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" fontWeight="medium">
                    {history.processName} (PID: {history.pid})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(history.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  {history.predictions.length} prediction(s)
                </Typography>
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  {history.predictions.map((pred, pIdx) => (
                    <Chip
                      key={pIdx}
                      label={`${pred.type?.replace('_', ' ') || 'Prediction'} (${pred.confidence}%)`}
                      size="small"
                      sx={{
                        backgroundColor: getPredictionSeverityColor(pred.severity),
                        color: 'white',
                        fontSize: '0.6rem',
                        height: 18
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
            {predictionHistory.length === 0 && (
              <Typography color="text.secondary" align="center" py={2}>
                No prediction history yet
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              High-Risk Processes
            </Typography>
            {processes
              .filter(p => calculateRiskScore(p) > 60)
              .slice(0, 5)
              .map((process) => {
                const predictions = processPredictions[process.pid]?.predictions || [];
                const isCurrentlyAnalyzing = currentlyAnalyzing.some(p => p.pid === process.pid);
                
                return (
                  <Box key={process.pid} sx={{ 
                    mb: 2, 
                    p: 1.5, 
                    backgroundColor: 'rgba(255, 68, 68, 0.1)', 
                    borderRadius: 1,
                    border: '1px solid rgba(255, 68, 68, 0.2)'
                  }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="body2" fontWeight="medium">
                        {process.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {isCurrentlyAnalyzing && <PulsingAiIcon size={16} iconSize={8} />}
                        <Chip
                          label={isCurrentlyAnalyzing ? "Analyzing" : "High Risk"}
                          size="small"
                          sx={{ 
                            backgroundColor: isCurrentlyAnalyzing ? '#2196f3' : '#ff4444', 
                            color: 'white' 
                          }}
                        />
                      </Box>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption">
                        CPU: {formatPercentage(process.cpuUsage)}
                      </Typography>
                      <Typography variant="caption">
                        Memory: {formatBytes(process.memoryUsage)}
                      </Typography>
                      <Typography variant="caption">
                        Threads: {process.threadCount}
                      </Typography>
                    </Box>
                    {predictions.length > 0 ? (
                      <Alert severity="warning" sx={{ py: 0, fontSize: '0.75rem' }}>
                        {predictions[0].message}
                      </Alert>
                    ) : isCurrentlyAnalyzing ? (
                      <Alert severity="info" sx={{ py: 0, fontSize: '0.75rem' }}>
                        AI analysis in progress...
                      </Alert>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PsychologyIcon />}
                        onClick={() => predictProcessBehavior(process)}
                        sx={{ mt: 1 }}
                        color="warning"
                        disabled={!geminiService.enabled}
                      >
                        Analyze Risk
                      </Button>
                    )}
                  </Box>
                );
              })}
            {processes.filter(p => calculateRiskScore(p) > 60).length === 0 && (
              <Typography color="text.secondary" align="center" py={2}>
                No high-risk processes detected
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Process Statistics - Updated with prediction stats */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top CPU Processes
            </Typography>
            {processes
              .sort((a, b) => b.cpuUsage - a.cpuUsage)
              .slice(0, 5)
              .map((process, index) => (
                <Box key={process.pid} sx={{ mb: 1, p: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {process.name}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatPercentage(process.cpuUsage)}
                    </Typography>
                  </Box>
                </Box>
              ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Prediction Statistics
            </Typography>
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Processes Analyzed
              </Typography>
              <Typography variant="h5">
                {Object.keys(processPredictions).length}
              </Typography>
            </Box>
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Active Predictions
              </Typography>
              <Typography variant="h5">
                {Object.values(processPredictions).reduce((sum, p) => sum + (p.predictions?.length || 0), 0)}
              </Typography>
            </Box>
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Currently Analyzing
              </Typography>
              <Typography variant="h5">
                {currentlyAnalyzing.length}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Process Statistics
            </Typography>
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Processes
              </Typography>
              <Typography variant="h5">{processes.length}</Typography>
            </Box>
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Running Processes
              </Typography>
              <Typography variant="h5">
                {processes.filter(p => p.state === 'RUNNING').length}
              </Typography>
            </Box>
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Threads
              </Typography>
              <Typography variant="h5">
                {processes.reduce((sum, p) => sum + (p.threadCount || 0), 0)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProcessList;