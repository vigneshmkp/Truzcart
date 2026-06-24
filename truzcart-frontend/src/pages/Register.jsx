import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, Container, Typography, TextField, Button, Paper, InputAdornment, IconButton, Alert, Grid
} from '@mui/material';
import { Email, Lock, Person, Phone, Visibility, VisibilityOff, Storefront } from '@mui/icons-material';
import { authService } from '../services/api';
import { loginSuccess } from '../store/authSlice';

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authService.register(formData);
      dispatch(loginSuccess(response.data.data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '80vh', display: 'flex', alignItems: 'center',
      background: 'linear-gradient(135deg, #F8F9FE 0%, #FFF0F3 100%)', py: 4,
    }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{
          p: { xs: 4, md: 6 }, borderRadius: 4,
          border: '1px solid rgba(255,101,132,0.1)',
          boxShadow: '0 8px 40px rgba(255, 101, 132, 0.08)',
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #FF6584, #FF8FA3)', color: 'white' }}>
                <Storefront sx={{ fontSize: 32 }} />
              </Box>
            </Box>
            <Typography variant="h4" fontWeight={800}>Create Account</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Join TruzCart and start shopping
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth label="First Name" name="firstName" required value={formData.firstName}
                  onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Last Name" name="lastName" required value={formData.lastName}
                  onChange={handleChange} />
              </Grid>
            </Grid>
            <TextField fullWidth label="Email Address" name="email" type="email" required
              value={formData.email} onChange={handleChange} sx={{ mt: 2.5 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }} />
            <TextField fullWidth label="Phone (Optional)" name="phone" value={formData.phone}
              onChange={handleChange} sx={{ mt: 2.5 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Phone color="action" /></InputAdornment> }} />
            <TextField fullWidth label="Password" name="password" required
              type={showPassword ? 'text' : 'password'} value={formData.password}
              onChange={handleChange} sx={{ mt: 2.5, mb: 3 }}
              helperText="Must be at least 8 characters"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                endAdornment: <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>,
              }} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{ py: 1.5, fontSize: '1rem', background: 'linear-gradient(135deg, #FF6584, #FF8FA3)' }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3, color: 'text.secondary' }}>
            Already have an account?{' '}
            <Button component={Link} to="/login" sx={{ fontWeight: 700 }}>Sign In</Button>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Register;
