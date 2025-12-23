import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, LogIn, AlertCircle, Home, Sparkles } from 'lucide-react';
import '../style/LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(formData);
    setIsLoading(false);
    
    if (result.success) {
      navigate('/app/dashboard');
    }
  };

  const handleDemoLogin = async () => {
    setFormData({
      username: 'demo',
      password: 'demo123'
    });
    
    setIsLoading(true);
    const result = await login({
      username: 'demo',
      password: 'demo123'
    });
    setIsLoading(false);
    
    if (result.success) {
      navigate('/app/dashboard');
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
        
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo">
                <Lock size={32} className="auth-logo-icon" />
                {/* <h1>SystemAI</h1> */}
              </div>
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">Sign in to your account to continue</p>
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
                  Username or Email
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your username or email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <Lock size={18} />
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div> */}

              <button
                type="submit"
                className="auth-button primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <LogIn size={20} />
                    Sign In
                  </>
                )}
              </button>

              <div className="divider">
                
              </div>

            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                  Sign up
                </Link>
              </p>
              {/* <div className="home-link">
                <Link to="/" className="auth-link">
                  <Home size={16} />
                  Back to Home
                </Link>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;