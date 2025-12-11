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
  return `${value.toFixed(1)}%`;
};

export const formatTemperature = (temp) => {
  if (temp <= 0) return 'N/A';
  return `${temp.toFixed(1)}°C`;
};

// ADD THIS FUNCTION - Missing formatHertz
export const formatHertz = (hertz) => {
  if (hertz < 0) return 'N/A';
  if (hertz < 1000) return hertz + ' Hz';
  let value = hertz / 1000.0;
  if (value < 1000) return `${value.toFixed(1)} KHz`;
  value /= 1000.0;
  if (value < 1000) return `${value.toFixed(1)} MHz`;
  value /= 1000.0;
  return `${value.toFixed(1)} GHz`;
};

// ADD THIS FUNCTION - Missing formatUptime
export const formatUptime = (seconds) => {
  if (seconds < 60) return seconds + ' seconds';
  
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days} days, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else {
    return `${minutes} minutes`;
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'CRITICAL':
      return '#ff4444';
    case 'WARNING':
      return '#ffbb33';
    case 'HEALTHY':
      return '#00C851';
    default:
      return '#666666';
  }
};

export const getAlertColor = (level) => {
  switch (level) {
    case 'CRITICAL':
      return '#ff4444';
    case 'WARNING':
      return '#ffbb33';
    default:
      return '#666666';
  }
};