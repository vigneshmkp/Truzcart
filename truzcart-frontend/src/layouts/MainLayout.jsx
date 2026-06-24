import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Badge, Box, Container,
  Menu, MenuItem, Avatar, InputBase, Divider
} from '@mui/material';
import {
  ShoppingCart, Person, Search, Storefront, Logout, Dashboard, ListAlt,
  FavoriteBorder, AccountCircle
} from '@mui/icons-material';
import { useState } from 'react';
import { logout, selectUser, selectIsAuthenticated, selectIsAdmin } from '../store/authSlice';
import { selectCartTotalItems } from '../store/cartSlice';

function MainLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const cartCount = useSelector(selectCartTotalItems);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setAnchorEl(null);
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="default" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2 }}>
            {/* Logo */}
            <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: 1 }}>
              <Storefront sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography variant="h5" sx={{
                background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontWeight: 800, letterSpacing: '-0.02em',
              }}>
                TruzCart
              </Typography>
            </Box>

            {/* Search Bar */}
            <Box component="form" onSubmit={handleSearch} sx={{
              display: { xs: 'none', md: 'flex' }, flex: 1, maxWidth: 500, mx: 'auto',
              bgcolor: 'grey.100', borderRadius: 3, px: 2, py: 0.5, alignItems: 'center',
            }}>
              <Search sx={{ color: 'text.secondary', mr: 1 }} />
              <InputBase
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flex: 1, fontSize: '0.95rem' }}
                fullWidth
              />
            </Box>

            {/* Right Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button component={Link} to="/products" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                Shop
              </Button>

              {isAuthenticated ? (
                <>
                  <IconButton component={Link} to="/wishlist">
                    <FavoriteBorder />
                  </IconButton>

                  <IconButton component={Link} to="/cart">
                    <Badge badgeContent={cartCount} color="secondary">
                      <ShoppingCart />
                    </Badge>
                  </IconButton>

                  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <Avatar sx={{
                      width: 36, height: 36,
                      background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                      fontSize: '0.9rem', fontWeight: 700,
                    }}>
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </Avatar>
                  </IconButton>

                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)} PaperProps={{ sx: { minWidth: 200, borderRadius: 2, mt: 1 } }}>
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {user?.firstName} {user?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                    </Box>
                    <Divider />
                    {isAdmin && (
                      <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin'); }}>
                        <Dashboard sx={{ mr: 1.5, fontSize: 20 }} /> Admin Dashboard
                      </MenuItem>
                    )}
                    <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                      <AccountCircle sx={{ mr: 1.5, fontSize: 20 }} /> My Profile
                    </MenuItem>
                    <MenuItem onClick={() => { setAnchorEl(null); navigate('/orders'); }}>
                      <ListAlt sx={{ mr: 1.5, fontSize: 20 }} /> My Orders
                    </MenuItem>
                    <MenuItem onClick={() => { setAnchorEl(null); navigate('/wishlist'); }}>
                      <FavoriteBorder sx={{ mr: 1.5, fontSize: 20 }} /> My Wishlist
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <Logout sx={{ mr: 1.5, fontSize: 20 }} /> Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button component={Link} to="/login" variant="outlined" size="small">Login</Button>
                  <Button component={Link} to="/register" variant="contained" size="small">Sign Up</Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Page Content */}
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{
        bgcolor: '#1A1D2E', color: 'white', py: 6, mt: 'auto',
      }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 4 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Storefront sx={{ color: '#6C63FF' }} />
                <Typography variant="h6" fontWeight={800}>TruzCart</Typography>
              </Box>
              <Typography variant="body2" color="grey.400">
                Your one-stop shop for groceries, electronics, clothing, accessories & more.
                Quality products at the best prices.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Quick Links</Typography>
              {['Home', 'Products', 'Categories', 'About Us'].map((link) => (
                <Typography key={link} variant="body2" color="grey.400" sx={{ mb: 0.5, cursor: 'pointer', '&:hover': { color: '#6C63FF' } }}>
                  {link}
                </Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Customer Service</Typography>
              {['Track Order', 'Returns & Refunds', 'FAQs', 'Contact Us'].map((link) => (
                <Typography key={link} variant="body2" color="grey.400" sx={{ mb: 0.5, cursor: 'pointer', '&:hover': { color: '#6C63FF' } }}>
                  {link}
                </Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Connect</Typography>
              <Typography variant="body2" color="grey.400" sx={{ mb: 0.5 }}>
                support@truzcart.com
              </Typography>
              <Typography variant="body2" color="grey.400">
                +91 98765 43210
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 4, borderColor: 'grey.800' }} />
          <Typography variant="body2" color="grey.500" textAlign="center">
            © 2025 TruzCart. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default MainLayout;
