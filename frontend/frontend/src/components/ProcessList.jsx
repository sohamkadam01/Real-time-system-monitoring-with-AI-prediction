import React, { useState, useEffect } from 'react';
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
  Grid,  // ADD THIS IMPORT
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
} from '@mui/icons-material';
import { systemApi } from '../services/api';
import { formatBytes, formatPercentage } from '../utils/formatters';

const ProcessList = () => {
  const [processes, setProcesses] = useState([]);
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('cpuUsage');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const response = await systemApi.getProcesses();
        setProcesses(response.data.processes || []);
      } catch (error) {
        console.error('Error fetching processes:', error);
      }
    };

    fetchProcesses();
    const interval = setInterval(fetchProcesses, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = [...processes];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.pid.toString().includes(term)
      );
    }
    
    // Sort processes
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Process List
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Running Processes ({processes.length})
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
                <TableCell>State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProcesses.slice(0, 50).map((process) => (
                <TableRow key={process.pid} hover>
                  <TableCell>{process.pid}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
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
                    <Chip
                      label={process.state}
                      size="small"
                      sx={{
                        backgroundColor: process.state === 'RUNNING' ? '#4caf50' : 
                                        process.state === 'SLEEPING' ? '#ff9800' : '#757575',
                        color: 'white',
                        minWidth: 80,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Process Statistics */}
      <Grid container spacing={3}>
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
              Top Memory Processes
            </Typography>
            {processes
              .sort((a, b) => b.memoryUsage - a.memoryUsage)
              .slice(0, 5)
              .map((process, index) => (
                <Box key={process.pid} sx={{ mb: 1, p: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {process.name}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatBytes(process.memoryUsage)}
                    </Typography>
                  </Box>
                </Box>
              ))}
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
                {processes.reduce((sum, p) => sum + p.threadCount, 0)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProcessList;