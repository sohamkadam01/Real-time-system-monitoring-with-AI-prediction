import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const systemApi = {
  // Get complete system metrics
  getMetrics: () => api.get('/monitor/metrics'),
  
  // Get dashboard metrics
  getDashboard: () => api.get('/monitor/dashboard'),
  
  // Get CPU metrics
  getCpu: () => api.get('/monitor/cpu'),
  
  // Get memory metrics
  getMemory: () => api.get('/monitor/memory'),
  
  // Get disk metrics
  getDisks: () => api.get('/monitor/disks'),
  
  // Get network metrics
  getNetworks: () => api.get('/monitor/networks'),
  
  // Get process metrics
  getProcesses: () => api.get('/monitor/processes'),
  
  // Get alerts
  getAlerts: () => api.get('/monitor/alerts'),
};