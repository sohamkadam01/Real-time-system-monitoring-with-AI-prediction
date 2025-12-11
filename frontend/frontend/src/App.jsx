import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Paper,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Memory,
  Storage,
  NetworkCheck,
  ListAlt,
  Warning,
  Menu as MenuIcon,
} from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import CpuMetrics from './components/CpuMetrics';
import MemoryMetrics from './components/MemoryMetrics';
import DiskMetrics from './components/DiskMetrics';
import NetworkMetrics from './components/NetworkMetrics';
import ProcessList from './components/ProcessList';
import AlertsPanel from './components/AlertsPanel';
import { WebSocketProvider } from './services/websocket';
import './App.css';

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
      default: '#0a1929',
      paper: '#1a2027',
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
      <WebSocketProvider>
        <Router>
          <CssBaseline />
          <Box sx={{ display: 'flex' }}>
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
            
            <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}>
              <Container maxWidth="xl">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/cpu" element={<CpuMetrics />} />
                  <Route path="/memory" element={<MemoryMetrics />} />
                  <Route path="/disks" element={<DiskMetrics />} />
                  <Route path="/network" element={<NetworkMetrics />} />
                  <Route path="/processes" element={<ProcessList />} />
                  <Route path="/alerts" element={<AlertsPanel />} />
                </Routes>
              </Container>
            </Box>
          </Box>
        </Router>
      </WebSocketProvider>
    </ThemeProvider>
  );
}

export default App;