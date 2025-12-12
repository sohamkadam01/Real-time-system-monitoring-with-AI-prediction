// App.jsx - Only ONE Router here
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Your components
import Dashboard from './components/Dashboard';
import CpuMetrics from './components/CpuMetrics';
import MemoryMetrics from './components/MemoryMetrics';
import DiskMetrics from './components/DiskMetrics';
import NetworkMetrics from './components/NetworkMetrics';
import ProcessList from './components/ProcessList';
import AlertsPanel from './components/AlertsPanel';
import IntroPage from './components/IntroPage'; // If you have this
import { WebSocketProvider } from './services/websocket';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#000000', // BLACK
      paper: '#121212',
    },
  },
});

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ width: 250, paddingTop: 2 }}>
      <List>
        <ListItemButton component={Link} to="/">
          <ListItemIcon><Home /></ListItemIcon>
          <ListItemText primary="Home" />
        </ListItemButton>
        <ListItemButton component={Link} to="/dashboard">
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component={Link} to="/cpu">
          <ListItemIcon><Memory /></ListItemIcon>
          <ListItemText primary="CPU" />
        </ListItemButton>
        <ListItemButton component={Link} to="/memory">
          <ListItemIcon><Memory /></ListItemIcon>
          <ListItemText primary="Memory" />
        </ListItemButton>
        <ListItemButton component={Link} to="/disks">
          <ListItemIcon><Storage /></ListItemIcon>
          <ListItemText primary="Disks" />
        </ListItemButton>
        <ListItemButton component={Link} to="/network">
          <ListItemIcon><NetworkCheck /></ListItemIcon>
          <ListItemText primary="Network" />
        </ListItemButton>
        <ListItemButton component={Link} to="/processes">
          <ListItemIcon><ListAlt /></ListItemIcon>
          <ListItemText primary="Processes" />
        </ListItemButton>
        <ListItemButton component={Link} to="/alerts">
          <ListItemIcon><Warning /></ListItemIcon>
          <ListItemText primary="Alerts" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router> {/* ONE AND ONLY Router wrapper */}
        <WebSocketProvider>
          <Box sx={{ 
            display: 'flex', 
            bgcolor: 'background.default',
            minHeight: '100vh' 
          }}>
            <Routes>
              {/* Home/Intro Route */}
              <Route path="/" element={
                <Box sx={{ width: '100%' }}>
                  <IntroPage />
                </Box>
              } />
              
              {/* Dashboard and other pages with sidebar */}
              <Route path="/*" element={
                <>
                  <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
                    <Toolbar>
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
                      <Typography variant="h6" noWrap component="div">
                        Real-Time System Monitor
                      </Typography>
                    </Toolbar>
                  </AppBar>
                  
                  {isMobile ? (
                    <Drawer
                      variant="temporary"
                      open={mobileOpen}
                      onClose={handleDrawerToggle}
                      ModalProps={{ keepMounted: true }}
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
                        },
                      }}
                    >
                      {drawer}
                    </Drawer>
                  )}
                  
                  <Box component="main" sx={{ 
                    flexGrow: 1, 
                    p: 3, 
                    marginTop: '64px',
                    bgcolor: 'background.default'
                  }}>
                    <Container maxWidth="xl">
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/cpu" element={<CpuMetrics />} />
                        <Route path="/memory" element={<MemoryMetrics />} />
                        <Route path="/disks" element={<DiskMetrics />} />
                        <Route path="/network" element={<NetworkMetrics />} />
                        <Route path="/processes" element={<ProcessList />} />
                        <Route path="/alerts" element={<AlertsPanel />} />
                      </Routes>
                    </Container>
                  </Box>
                </>
              } />
            </Routes>
          </Box>
        </WebSocketProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;