import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  User, 
  LogIn, 
  AlertCircle, 
  Home, 
  Shield,
  Key,
  Server,
  Users
} from 'lucide-react';
import '../style/LoginPage.css';
import authService from '../services/auth'; // ✅ CORRECT IMPORT

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    loginType: 'user' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      const result = await authService.testConnection();
      setConnectionStatus(result);
      
      if (result.success) {
        setServerInfo(result.data);
      }
    } catch (err) {
      setConnectionStatus({ success: false, error: 'Cannot connect to server' });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginTypeChange = (type) => {
    setFormData({
      ...formData,
      loginType: type
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await login(formData);
      
      console.log('🚀 === LOGIN DEBUG START ===');
      console.log('Login result success:', result.success);
      console.log('Login result data:', result.data);
      
      // Get fresh data from authService
      const currentUser = authService.getCurrentUser();
      const isAdmin = authService.isAdmin();
      
      console.log('Current user:', currentUser);
      console.log('User role:', currentUser?.role);
      console.log('Is admin?', isAdmin);
      console.log('🚀 === LOGIN DEBUG END ===');
      
      setIsLoading(false);
      
      if (result.success) {
        // Small delay to ensure everything is updated
        setTimeout(() => {
          const finalIsAdmin = authService.isAdmin();
          console.log('Final admin check:', finalIsAdmin);
          
          if (finalIsAdmin) {
            console.log('✅ Redirecting to /admin/dashboard');
            navigate('/admin/dashboard'); // ✅ CORRECT PATH
          } else {
            console.log('✅ Redirecting to /app/dashboard');
            navigate('/app/dashboard');
          }
        }, 100);
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Login error:', err);
    }
  };

  const handleDemoLogin = async (type = 'user') => {
    const demoCredentials = {
      user: { username: 'user1', password: 'password123' },
      admin: { username: 'admin1', password: 'admin123' }
    };
    
    setFormData({
      ...formData,
      ...demoCredentials[type],
      loginType: type
    });
    
    setIsLoading(true);
    const result = await login({
      ...demoCredentials[type],
      loginType: type
    });
    setIsLoading(false);
    
    if (result.success) {
      setTimeout(() => {
        const isAdmin = authService.isAdmin();
        if (isAdmin) {
          navigate('/admin/dashboard'); // ✅ CORRECT PATH
        } else {
          navigate('/app/dashboard');
        }
      }, 100);
    }
  };

  const handleTestAdminAccess = async () => {
    if (!authService.isAuthenticated()) {
      alert('Please login first');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await authService.testAdminAccess();
      alert(result.success 
        ? `Admin access confirmed! Found ${result.userCount} users.`
        : `Admin access denied: ${result.error}`
      );
    } catch (err) {
      alert('Error testing admin access: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-popup-overlay">
      {/* Particle system */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="login-popup-container">
        {/* Animated border effect */}
        <div className="border-effect"></div>
        
        {/* Server Status Indicator */}
        {connectionStatus && (
          <div className={`server-status ${connectionStatus.success ? 'online' : 'offline'}`}>
            <Server size={16} />
            <span>
              {connectionStatus.success ? 'Backend Connected' : 'Backend Offline'}
              {serverInfo?.appName && ` • ${serverInfo.appName}`}
            </span>
          </div>
        )}

        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo">
                <Shield size={36} className="auth-logo-icon" />
                <div className="logo-text">
                  <h1>SystemMonitor</h1>
                  <p className="logo-subtitle">Administration Panel</p>
                </div>
              </div>
              <h2 className="auth-title">System Authentication</h2>
              <p className="auth-subtitle">
                {formData.loginType === 'admin' 
                  ? 'Admin access for system management'
                  : 'User access for monitoring dashboard'
                }
              </p>
            </div>

            {/* Login Type Selector */}
            <div className="login-type-selector">
              <button
                type="button"
                className={`type-btn ${formData.loginType === 'user' ? 'active' : ''}`}
                onClick={() => handleLoginTypeChange('user')}
                disabled={isLoading}
              >
                <User size={18} />
                User Login
              </button>
              <button
                type="button"
                className={`type-btn ${formData.loginType === 'admin' ? 'active' : ''}`}
                onClick={() => handleLoginTypeChange('admin')}
                disabled={isLoading}
              >
                <Shield size={18} />
                Admin Login
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="auth-error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  <User size={18} />
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={
                    formData.loginType === 'admin' 
                      ? "Enter admin username" 
                      : "Enter your username"
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <Key size={18} />
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={
                    formData.loginType === 'admin'
                      ? "Enter admin password"
                      : "Enter your password"
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Admin Login Note */}
              {formData.loginType === 'admin' && (
                <div className="admin-note">
                  <Shield size={16} />
                  <span>Admin access requires special privileges</span>
                </div>
              )}

              <button
                type="submit"
                className={`auth-button ${formData.loginType === 'admin' ? 'admin-btn' : 'primary'}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <LogIn size={20} />
                    {formData.loginType === 'admin' ? 'Admin Sign In' : 'User Sign In'}
                  </>
                )}
              </button>

              <div className="divider">
                <span>Quick Access</span>
              </div>

              <div className="demo-buttons">
                <button
                  type="button"
                  className="demo-btn user-demo"
                  onClick={() => handleDemoLogin('user')}
                  disabled={isLoading}
                >
                  <User size={16} />
                  Demo User
                </button>
                <button
                  type="button"
                  className="demo-btn admin-demo"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={isLoading}
                >
                  <Shield size={16} />
                  Demo Admin
                </button>
              </div>

              {/* Debug button */}
              <div className="debug-section">
                <button
                  type="button"
                  className="debug-btn"
                  onClick={() => {
                    console.log('=== DEBUG ===');
                    console.log('Token:', localStorage.getItem('token'));
                    console.log('User in localStorage:', localStorage.getItem('user'));
                    console.log('Parsed user:', JSON.parse(localStorage.getItem('user') || 'null'));
                    console.log('authService.getCurrentUser():', authService.getCurrentUser());
                    console.log('authService.isAdmin():', authService.isAdmin());
                  }}
                >
                  Debug Auth
                </button>
              </div>

              {/* Admin Test Button */}
              {authService.isAuthenticated() && (
                <div className="admin-test-section">
                  <button
                    type="button"
                    className="test-admin-btn"
                    onClick={handleTestAdminAccess}
                    disabled={isLoading}
                  >
                    <Users size={16} />
                    Test Admin Access
                  </button>
                </div>
              )}
            </form>

            <div className="auth-footer">
              <div className="footer-links">
                <Link to="/" className="auth-link">
                  <Home size={16} />
                  Back to Home
                </Link>
                <span className="separator">•</span>
                {formData.loginType === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => handleLoginTypeChange('user')}
                    className="auth-link"
                  >
                    <User size={16} />
                    User Login
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleLoginTypeChange('admin')}
                    className="auth-link"
                  >
                    <Shield size={16} />
                    Admin Panel
                  </button>
                )}
              </div>
              
              {connectionStatus && !connectionStatus.success && (
                <div className="connection-help">
                  <AlertCircle size={14} />
                  <span>Ensure backend is running at localhost:8080</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="features-highlight">
          <div className="feature">
            <Shield size={20} />
            <div>
              <h4>Admin Features</h4>
              <p>User management, system configuration, analytics</p>
            </div>
          </div>
          <div className="feature">
            <Server size={20} />
            <div>
              <h4>System Monitoring</h4>
              <p>Real-time system metrics and performance tracking</p>
            </div>
          </div>
          <div className="feature">
            <Users size={20} />
            <div>
              <h4>User Management</h4>
              <p>Full control over user accounts and permissions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;