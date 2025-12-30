import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useMediaQuery,
  CssBaseline,
  Button,
  Avatar,
  Divider,
  Badge,
  Paper,
  useTheme,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Memory,
  Storage,
  NetworkCheck,
  ListAlt,
  Warning,
  Menu as MenuIcon,
  Home,
  Logout,
  Person,
  Settings,
  Timeline,
  Speed,
  Devices,
  MonitorHeart,
  AdminPanelSettings,
  People,
  Security,
  Analytics,
  Assignment,
  SupervisedUserCircle,
  Report,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Import all components
import Dashboard from './components/Dashboard';
import CpuMetrics from './components/CpuMetrics';
import MemoryMetrics from './components/MemoryMetrics';
import DiskMetrics from './components/DiskMetrics';
import NetworkMetrics from './components/NetworkMetrics';
import ProcessList from './components/ProcessList';
import AlertsPanel from './components/AlertsPanel';
import IntroPage from './components/IntroPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

// Import Admin components
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './pages/UserManagement';

// Import AuthProvider and useAuth from contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './services/websocket';

// Import auth service
import authService from './services/auth';

// Minimal Black Theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
      light: '#ffffff',
      dark: '#cccccc',
    },
    secondary: {
      main: '#00ff88',
    },
    background: {
      default: '#000000',
      paper: '#111111',
    },
    text: {
      primary: '#ffffff',
      secondary: '#888888',
    },
    divider: '#222222',
    error: {
      main: '#ff4444',
    },
    warning: {
      main: '#ffbb33',
    },
    info: {
      main: '#33b5e5',
    },
    success: {
      main: '#00ff88',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          borderBottom: '1px solid #222222',
          backdropFilter: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#000000',
          borderRight: '1px solid #222222',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
        contained: {
          backgroundColor: '#222222',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
        outlined: {
          borderColor: '#333333',
          color: '#ffffff',
          '&:hover': {
            borderColor: '#ffffff',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            borderLeft: '3px solid #00ff88',
            '&:hover': {
              backgroundColor: 'rgba(0, 255, 136, 0.15)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
          border: '1px solid #222222',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
          border: '1px solid #222222',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: '#222222',
          borderRadius: 4,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#222222',
          color: '#ffffff',
        },
      },
    },
  },
});

// Navigation component with logout
const Navigation = ({ isMobile, mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  
  const isAdmin = authService.isAdmin();
  const currentUser = authService.getCurrentUser();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAdminPanel = () => {
    handleMenuClose();
    navigate('/admin/admindashboard');
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/app/profile');
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const menuItems = [
    { path: '/app/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
    { path: '/app/cpu', icon: <Speed />, label: 'CPU' },
    { path: '/app/memory', icon: <Memory />, label: 'Memory' },
    { path: '/app/disks', icon: <Storage />, label: 'Disks' },
    { path: '/app/network', icon: <NetworkCheck />, label: 'Network' },
    { path: '/app/processes', icon: <Devices />, label: 'Processes' },
    { path: '/app/alerts', icon: <Warning />, label: 'Alerts', badge: 3 },
  ];

  const adminMenuItems = [
    { path: '/admin/admindashboard', icon: <AdminPanelSettings />, label: 'Admin Dashboard' },
    { path: '/admin/users', icon: <People />, label: 'User Management' },
    { path: '/admin/analytics', icon: <Analytics />, label: 'Analytics' },
    { path: '/admin/reports', icon: <Report />, label: 'Reports' },
  ];

  const drawer = (
    <Box sx={{ 
      width: 250, 
      padding: 2,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header with system info */}
      <Box sx={{ 
        p: 2, 
        mb: 2,
        borderRadius: 1,
        backgroundColor: '#111111',
        border: '1px solid #222222',
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          {/* Logo placeholder */}
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#222222', my: 1 }} />

      {/* Main Navigation */}
      <List sx={{ flexGrow: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, mb: 1 }}>
          MONITORING
        </Typography>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            sx={{
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 36,
              color: 'text.secondary',
            }}>
              {item.badge ? (
                <Badge 
                  badgeContent={item.badge} 
                  color="error" 
                  size="small"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6rem',
                      height: '16px',
                      minWidth: '16px',
                    }
                  }}
                >
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="body2">
                  {item.label}
                </Typography>
              } 
            />
          </ListItemButton>
        ))}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <Divider sx={{ borderColor: '#222222', my: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, mb: 1 }}>
              ADMINISTRATION
            </Typography>
            {adminMenuItems.map((item) => (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderLeft: '3px solid #8b5cf6',
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 36,
                  color: 'text.secondary',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography variant="body2">
                      {item.label}
                    </Typography>
                  } 
                />
              </ListItemButton>
            ))}
          </>
        )}
      </List>

      {/* User section */}
      {currentUser && (
        <>
          <Divider sx={{ borderColor: '#222222', my: 1 }} />
          <Box sx={{ p: 1.5, borderRadius: 1, backgroundColor: '#111111' }}>
            <Box display="flex" alignItems="center" gap={2} mb={1.5}>
              <Avatar sx={{ 
                bgcolor: isAdmin ? '#8b5cf6' : '#222222',
                width: 32,
                height: 32,
                fontSize: '0.8rem',
              }}>
                {currentUser.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" fontWeight={500} display="block">
                  {currentUser.username}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  {isAdmin ? (
                    <Chip
                      label="ADMIN"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        bgcolor: '#8b5cf6',
                        color: '#ffffff',
                      }}
                    />
                  ) : (
                    <Chip
                      label="USER"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        bgcolor: '#333333',
                        color: '#ffffff',
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<Logout />}
              onClick={logout}
            >
              Sign Out
            </Button>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <>
      <AppBar position="fixed">
        <Toolbar sx={{ minHeight: '64px !important' }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box display="flex" alignItems="center" gap={2} sx={{ flexGrow: 1 }}>
            <Box sx={{ 
              width: 32, 
              height: 32, 
              backgroundColor: isAdmin ? '#8b5cf6' : '#00ff88',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              fontWeight: 'bold',
              fontSize: '0.9rem',
            }}>
              {isAdmin ? 'A' : 'S'}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600} noWrap>
                {isAdmin ? 'Admin Panel' : 'System Monitor'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {isAdmin ? 'Administration & Management' : 'Real-time metrics'}
              </Typography>
            </Box>
          </Box>
          
          {currentUser ? (
            <Box display="flex" alignItems="center" gap={1}>
              {isAdmin && (
                <Button 
                  variant="contained"
                  component={Link} 
                  to="/app/dashboard"
                  size="small"
                  startIcon={<MonitorHeart />}
                  sx={{
                    bgcolor: '#00ff88',
                    color: '#000000',
                    '&:hover': {
                      bgcolor: '#00cc6a',
                    },
                    display: { xs: 'none', sm: 'flex' },
                  }}
                >
                  Monitor
                </Button>
              )}
              
              <Tooltip title="Account Settings">
                <IconButton 
                  size="small" 
                  onClick={handleMenuOpen}
                  sx={{ 
                    border: '1px solid #333333',
                    width: 40,
                    height: 40,
                  }}
                >
                  <Avatar sx={{ 
                    width: 24, 
                    height: 24,
                    bgcolor: isAdmin ? '#8b5cf6' : '#333333',
                    fontSize: '0.8rem',
                  }}>
                    {currentUser.username?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: '#111111',
                    border: '1px solid #222222',
                    mt: 1,
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2">{currentUser.username}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentUser.email || 'No email'}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: '#222222', my: 1 }} />
                
                <MenuItem onClick={handleProfile}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={handleProfile}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                
                {isAdmin && (
                  <MenuItem onClick={handleAdminPanel}>
                    <ListItemIcon>
                      <AdminPanelSettings fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Admin Panel</ListItemText>
                  </MenuItem>
                )}
                
                <Divider sx={{ borderColor: '#222222', my: 1 }} />
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button 
              variant="contained"
              component={Link} 
              to="/login"
              size="small"
            >
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              marginTop: '64px',
              height: 'calc(100% - 64px)',
            }
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: 250,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 250,
              boxSizing: 'border-box',
              marginTop: '64px',
              height: 'calc(100% - 64px)',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
};

// Main App Component
function AppContent() {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      backgroundColor: '#000000',
      minHeight: '100vh',
      color: '#ffffff',
    }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<IntroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected User App Routes */}
        <Route path="/app/*" element={
          <ProtectedRoute>
            <>
              <Navigation 
                isMobile={isMobile} 
                mobileOpen={mobileOpen} 
                handleDrawerToggle={handleDrawerToggle}
              />
              
              <Box 
                component="main" 
                sx={{ 
                  flexGrow: 1, 
                  p: { xs: 2, md: 3 },
                  marginTop: '64px',
                  backgroundColor: '#000000',
                  overflow: 'auto',
                  minHeight: 'calc(100vh - 64px)',
                }}
              >
                <Container 
                  maxWidth="xl" 
                  disableGutters={isMobile}
                  sx={{ 
                    maxWidth: '1600px !important',
                  }}
                >
                  <Paper
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderRadius: 2,
                      backgroundColor: '#111111',
                      border: '1px solid #222222',
                      minHeight: 'calc(100vh - 100px)',
                    }}
                  >
                    <Routes>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="cpu" element={<CpuMetrics />} />
                      <Route path="memory" element={<MemoryMetrics />} />
                      <Route path="disks" element={<DiskMetrics />} />
                      <Route path="network" element={<NetworkMetrics />} />
                      <Route path="processes" element={<ProcessList />} />
                      <Route path="alerts" element={<AlertsPanel />} />
                      <Route path="profile" element={<div>Profile Page</div>} />
                    </Routes>
                  </Paper>
                </Container>
              </Box>
            </>
          </ProtectedRoute>
        } />

        {/* Protected Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute adminOnly={true}>
            <>
              <Navigation 
                isMobile={isMobile} 
                mobileOpen={mobileOpen} 
                handleDrawerToggle={handleDrawerToggle}
              />
              
              <Box 
                component="main" 
                sx={{ 
                  flexGrow: 1, 
                  p: { xs: 2, md: 3 },
                  marginTop: '64px',
                  backgroundColor: '#000000',
                  overflow: 'auto',
                  minHeight: 'calc(100vh - 64px)',
                }}
              >
                <Container 
                  maxWidth="xl" 
                  disableGutters={isMobile}
                  sx={{ 
                    maxWidth: '1800px !important',
                  }}
                >
                  <Paper
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderRadius: 2,
                      backgroundColor: '#111111',
                      border: '1px solid #222222',
                      minHeight: 'calc(100vh - 100px)',
                    }}
                  >
                    <Routes>
                      <Route path="admindashboard" element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="analytics" element={<div>Admin Analytics</div>} />
                      <Route path="reports" element={<div>Admin Reports</div>} />
                    </Routes>
                  </Paper>
                </Container>
              </Box>
            </>
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
}

// Main App wrapper
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <WebSocketProvider>
            <AppContent />
          </WebSocketProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;