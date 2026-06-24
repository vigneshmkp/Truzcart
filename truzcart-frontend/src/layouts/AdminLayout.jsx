import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Divider
} from '@mui/material';
import {
  Dashboard, Inventory, Category, ShoppingCart, People, Storefront, ArrowBack,
  LocalOffer, RateReview, Group
} from '@mui/icons-material';
import { selectUser, logout } from '../store/authSlice';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
  { text: 'Products', icon: <Inventory />, path: '/admin/products' },
  { text: 'Categories', icon: <Category />, path: '/admin/categories' },
  { text: 'Orders', icon: <ShoppingCart />, path: '/admin/orders' },
  { text: 'Coupons', icon: <LocalOffer />, path: '/admin/coupons' },
  { text: 'Reviews', icon: <RateReview />, path: '/admin/reviews' },
  { text: 'Users', icon: <Group />, path: '/admin/users' },
];

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8F9FE' }}>
      {/* Sidebar */}
      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH, bgcolor: '#1A1D2E', color: 'white',
          borderRight: 'none', boxSizing: 'border-box',
        },
      }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Storefront sx={{ color: '#6C63FF', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={800} sx={{
            background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            TruzCart
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ px: 3, color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
          Admin Panel
        </Typography>

        <List sx={{ mt: 2, px: 1.5 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton component={Link} to={item.path} sx={{
                  borderRadius: 2, py: 1.2,
                  bgcolor: isActive ? 'rgba(108, 99, 255, 0.15)' : 'transparent',
                  color: isActive ? '#6C63FF' : 'grey.400',
                  '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.1)', color: '#6C63FF' },
                }}>
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 600 : 400, fontSize: '0.95rem' }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider sx={{ borderColor: 'grey.800', mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6C63FF, #FF6584)', fontSize: '0.85rem' }}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="caption" color="grey.500">Administrator</Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="default" elevation={0} sx={{
          bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
        }}>
          <Toolbar>
            <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Admin Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AdminLayout;
