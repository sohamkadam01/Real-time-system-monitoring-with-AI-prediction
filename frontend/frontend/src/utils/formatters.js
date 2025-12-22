// utils/formatters.js
export const formatBytes = (bytes) => {
  if (bytes < 0) return 'N/A';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let i = 0;
  
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  
  return `${value.toFixed(1)} ${units[i]}`;
};

export const formatPercentage = (value) => {
  if (value === undefined || value === null) return 'N/A';
  
  // Handle both percentage (0-100) and decimal (0-1) values
  const percentageValue = typeof value === 'number' 
    ? (value > 1 ? value : value * 100)
    : 0;
  
  return `${percentageValue.toFixed(1)}%`;
};

export const formatTemperature = (temp) => {
  if (temp === undefined || temp === null) return 'N/A';
  return `${temp.toFixed(1)}°C`;
};

export const formatHertz = (hertz) => {
  if (hertz === undefined || hertz === null || hertz < 0) return 'N/A';
  
  if (hertz === 0) return '0 Hz';
  if (hertz < 1000) return `${hertz} Hz`;
  
  let value = hertz / 1000.0;
  if (value < 1000) return `${value.toFixed(1)} KHz`;
  
  value /= 1000.0;
  if (value < 1000) return `${value.toFixed(1)} MHz`;
  
  value /= 1000.0;
  return `${value.toFixed(1)} GHz`;
};

export const formatUptime = (seconds) => {
  if (seconds === undefined || seconds === null || seconds < 0) return 'N/A';
  if (seconds < 60) return `${seconds} seconds`;
  
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  } else {
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
};

export const getStatusColor = (status) => {
  if (!status) return '#666666';
  
  switch (status.toUpperCase()) {
    case 'CRITICAL':
      return '#ff4444';
    case 'WARNING':
      return '#ffaa33';
    case 'HEALTHY':
    case 'NORMAL':
    case 'OK':
      return '#00ff88';
    default:
      return '#666666';
  }
};

export const getAlertColor = (level) => {
  if (!level) return '#666666';
  
  switch (level.toUpperCase()) {
    case 'CRITICAL':
      return '#ff4444';
    case 'WARNING':
      return '#ffaa33';
    case 'INFO':
      return '#33aaff';
    default:
      return '#666666';
  }
};

export const formatSpeed = (bytesPerSecond) => {
  if (bytesPerSecond === undefined || bytesPerSecond === null || bytesPerSecond < 0) return 'N/A';
  return `${formatBytes(bytesPerSecond)}/s`;
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const formatNumber = (num) => {
  if (num === undefined || num === null) return 'N/A';
  return num.toLocaleString('en-US');
};

// Date and time formatters
export const formatTimeAgo = (timestamp) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(timestamp);
};

export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};

export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
};

// Simple status checkers for black theme
export const getStatusText = (percentage, type = 'usage') => {
  if (percentage === undefined || percentage === null) return 'Unknown';
  
  if (type === 'temperature') {
    if (percentage > 80) return 'Critical';
    if (percentage > 70) return 'Warning';
    return 'Normal';
  }
  
  if (percentage >= 90) return 'Critical';
  if (percentage >= 75) return 'Warning';
  if (percentage >= 50) return 'Normal';
  return 'Good';
};

// Progress bar color for black theme
export const getProgressColor = (percentage) => {
  if (percentage >= 90) return '#ff4444';
  if (percentage >= 75) return '#ffaa33';
  if (percentage >= 50) return '#33aaff';
  return '#00ff88';
};

// Network speed formatter
export const formatNetworkSpeed = (bitsPerSecond) => {
  if (bitsPerSecond === undefined || bitsPerSecond === null || bitsPerSecond < 0) return 'N/A';
  
  if (bitsPerSecond < 1000) return `${bitsPerSecond.toFixed(0)} bps`;
  
  let value = bitsPerSecond / 1000.0;
  if (value < 1000) return `${value.toFixed(1)} Kbps`;
  
  value /= 1000.0;
  if (value < 1000) return `${value.toFixed(1)} Mbps`;
  
  value /= 1000.0;
  return `${value.toFixed(1)} Gbps`;
};

// Simplified formatter for dashboard display
export const formatValue = (value, unit = '') => {
  if (value === undefined || value === null) return 'N/A';
  return `${value.toFixed(1)}${unit}`;
};

// Duration formatter (simple version)
export const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null || seconds < 0) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};