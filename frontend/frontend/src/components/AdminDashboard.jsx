import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Button,
} from "@mui/material";
import {
  People as UsersIcon,
  Security as ShieldIcon,
  CheckCircle as UserCheckIcon,
  Cancel as UserXIcon,
  Refresh,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import axios from "axios";
import authService from "../services/auth";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    admins: 0,
    loading: true,
    error: null,
  });
  
  const navigate = useNavigate();
  const token = authService.getToken();
  const currentUser = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      console.log("Not admin, redirecting to user dashboard");
      navigate("/app/dashboard");
      return;
    }
    
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const res = await axios.get("http://localhost:8080/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const users = res.data;
      console.log("Fetched users:", users);

      const totalUsers = users.length;
      const activeUsers = users.filter((u) => u.enabled).length;
      const blockedUsers = users.filter((u) => !u.accountNonLocked).length;
      const admins = users.filter((u) => u.role === "ADMIN").length;

      setStats({
        totalUsers,
        activeUsers,
        blockedUsers,
        admins,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching users", error);
      
      if (error.response?.status === 403) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: "Access forbidden. Admin privileges required."
        }));
        navigate("/app/dashboard");
      } else {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error.response?.data?.message || "Failed to fetch users"
        }));
      }
    }
  };

  if (!isAdmin) {
    return null;
  }

  // Loading state
  if (stats.loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <LinearProgress sx={{ width: '100%', mb: 2 }} />
        <Typography>Loading admin dashboard...</Typography>
      </Box>
    );
  }

  // Error state
  if (stats.error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {stats.error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={fetchUsers}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Icon sx={{ fontSize: 40, color: color }} />
          <Box>
            <Typography variant="h4" fontWeight={600}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {description && (
              <Typography variant="caption" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, <strong>{currentUser?.username}</strong>
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchUsers}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={UsersIcon}
            color="#2196f3"
            description="All registered users"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={UserCheckIcon}
            color="#4caf50"
            description={`${stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Blocked Users"
            value={stats.blockedUsers}
            icon={UserXIcon}
            color="#f44336"
            description="Accounts locked or disabled"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Admins"
            value={stats.admins}
            icon={ShieldIcon}
            color="#ff9800"
            description="Users with admin privileges"
          />
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          📊 System Overview
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Active User Rate
              </Typography>
              <Typography variant="h5">
                {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Admin to User Ratio
              </Typography>
              <Typography variant="h5">
                1:{stats.totalUsers > 0 ? Math.round((stats.totalUsers - stats.admins) / stats.admins) : 0}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalUsers > 0 ? (stats.admins / stats.totalUsers) * 100 : 0}
                sx={{ mt: 1 }}
                color="warning"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Welcome Message for Admin */}
      <Paper sx={{ p: 3, bgcolor: 'primary.dark', color: 'white' }}>
        <Typography variant="h6" gutterBottom>
          🎉 Administrator Access Granted
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          You have full administrative privileges. You can manage all users, 
          configure system settings, and access advanced analytics from this dashboard.
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            sx={{ bgcolor: 'white', color: 'primary.dark' }}
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </Button>
          {/* <Button 
            variant="outlined" 
            sx={{ color: 'white', borderColor: 'white' }}
            onClick={() => navigate('/app/dashboard')}
          >
            View Monitoring Dashboard
          </Button> */}
        </Box>
      </Paper>
    </Box>
  );
}