import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      console.error('403 Forbidden - Admin access required');
      return Promise.reject(new Error('Access forbidden. Admin privileges required.'));
    }
    
    return Promise.reject(error);
  }
);

const authService = {
  // Login user - FIXED FOR YOUR RESPONSE STRUCTURE
  login: async (credentials) => {
    try {
      console.log('🔧 authService.login() - Request:', credentials);
      
      // Clear old data first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const response = await api.post('/auth/login', credentials);
      console.log('🔧 authService.login() - Full response:', response.data);
      
      if (response.data.token) {
        // Store token
        localStorage.setItem('token', response.data.token);
        console.log('🔧 Token stored:', response.data.token.substring(0, 20) + '...');
        
        // YOUR RESPONSE STRUCTURE: user is nested inside response.data.user
        const userFromResponse = response.data.user || {};
        console.log('🔧 User from response:', userFromResponse);
        
        // Create user data object
        const userData = {
          id: userFromResponse.id,
          username: userFromResponse.username,
          systemname: userFromResponse.systemname,
          email: userFromResponse.email,
          role: userFromResponse.role, // This is "ROLE_ADMIN" from your response
          ...userFromResponse
        };
        
        console.log('🔧 User data to store:', userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Verify storage
        console.log('🔧 Verification - Token in localStorage:', !!localStorage.getItem('token'));
        console.log('🔧 Verification - User in localStorage:', localStorage.getItem('user'));
      }
      
      return response.data;
    } catch (error) {
      console.error('🔧 Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    console.log('🔧 authService.logout()');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('🔧 getCurrentUser() - Returning:', user);
        return user;
      } catch (e) {
        console.error('🔧 Error parsing user data:', e);
        return null;
      }
    }
    console.log('🔧 getCurrentUser() - No user found');
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const hasToken = localStorage.getItem('token') !== null;
    console.log('🔧 isAuthenticated() - Result:', hasToken);
    return hasToken;
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Check if current user is admin - FIXED FOR "ROLE_ADMIN"
  isAdmin: () => {
    const user = authService.getCurrentUser();
    console.log('🔧 isAdmin() - User:', user);
    
    if (!user) {
      console.log('🔧 isAdmin() - No user, returning false');
      return false;
    }
    
    const userRole = user.role;
    console.log('🔧 isAdmin() - User role:', userRole);
    
    if (userRole) {
      const normalizedRole = userRole.toUpperCase();
      console.log('🔧 isAdmin() - Normalized role:', normalizedRole);
      
      // Check for "ROLE_ADMIN" (your backend returns this)
      const isAdminUser = 
        normalizedRole === 'ADMIN' || 
        normalizedRole === 'ROLE_ADMIN' ||
        normalizedRole.includes('ADMIN');
      
      console.log('🔧 isAdmin() - Result:', isAdminUser);
      return isAdminUser;
    }
    
    console.log('🔧 isAdmin() - No role found, returning false');
    return false;
  },

  // Get user role
  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || 'USER';
  },

  // ADMIN USER MANAGEMENT METHODS
  
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID (admin only)
  getUserById: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  // Update user (admin only)
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  // Delete user (admin only)
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  // Toggle user activation (admin only)
  toggleUserActivation: async (id, active) => {
    try {
      const response = await api.patch(`/admin/users/${id}/activate?active=${active}`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling user ${id} activation:`, error);
      throw error;
    }
  },

  // Test connection to backend
  testConnection: async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/auth/test', {
        timeout: 5000,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { 
        success: false, 
        error: error.message,
        status: error.response?.status
      };
    }
  },

  // Test admin access
  testAdminAccess: async () => {
    try {
      const response = await api.get('/admin/users');
      return { 
        success: true, 
        message: 'Admin access confirmed',
        userCount: response.data?.length || 0
      };
    } catch (error) {
      console.error('Admin access test failed:', error);
      return { 
        success: false, 
        error: error.message,
        status: error.response?.status
      };
    }
  },

  // Register user (if needed)
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
};

export default authService;