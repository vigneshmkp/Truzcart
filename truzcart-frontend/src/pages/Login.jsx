import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Container, Typography, TextField, Button, Paper, InputAdornment, IconButton, Alert
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, Storefront } from '@mui/icons-material';
import { authService } from '../services/api';
import { loginStart, loginSuccess, loginFailure, selectAuthLoading, selectAuthError } from '../store/authSlice';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      const response = await authService.login(formData);
      dispatch(loginSuccess(response.data.data));
      navigate('/');
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || 'Login failed'));
    }
  };

  return (
    <Box sx={{
      minHeight: '80vh', display: 'flex', alignItems: 'center',
      background: 'linear-gradient(135deg, #F8F9FE 0%, #EEE9FF 100%)',
    }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{
          p: { xs: 4, md: 6 }, borderRadius: 4,
          border: '1px solid rgba(108,99,255,0.1)',
          boxShadow: '0 8px 40px rgba(108, 99, 255, 0.08)',
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box sx={{
                p: 2, borderRadius: 3,
                background: 'linear-gradient(135deg, #6C63FF, #8B83FF)',
                color: 'white',
              }}>
                <Storefront sx={{ fontSize: 32 }} />
              </Box>
            </Box>
            <Typography variant="h4" fontWeight={800}>Welcome Back</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Sign in to your TruzCart account
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Email Address" type="email" required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
              sx={{ mb: 2.5 }}
            />
            <TextField
              fullWidth label="Password" required
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button component={Link} to="/forgot-password" size="small" sx={{ textTransform: 'none' }}>
                Forgot Password?
              </Button>
            </Box>

            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{ py: 1.5, fontSize: '1rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3, color: 'text.secondary' }}>
            Don't have an account?{' '}
            <Button component={Link} to="/register" sx={{ fontWeight: 700 }}>Sign Up</Button>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
