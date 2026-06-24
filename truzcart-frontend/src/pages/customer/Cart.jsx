import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, Container, Typography, Grid, Button, IconButton, Divider,
  Skeleton, Breadcrumbs, Chip, Alert
} from '@mui/material';
import {
  Add, Remove, Delete, ShoppingCart, NavigateNext, ShoppingBag,
  LocalShipping, ArrowForward
} from '@mui/icons-material';
import { cartService } from '../../services/api';
import { setCart, clearCart as clearCartState } from '../../store/cartSlice';
import { toast } from 'react-toastify';

function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await cartService.getCart();
      const data = res.data?.data;
      setCartData(data);
      dispatch(setCart({
        items: data?.items || [],
        totalItems: data?.items?.length || 0,
        totalPrice: data?.totalPrice || 0,
      }));
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const handleUpdateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    setUpdating(itemId);
    try {
      await cartService.updateQuantity(itemId, quantity);
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdating(itemId);
    try {
      await cartService.removeItem(itemId);
      toast.success('Item removed from cart');
      await fetchCart();
    } catch (err) {
      toast.error('Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const handleClearCart = async () => {
    try {
      await cartService.clearCart();
      dispatch(clearCartState());
      setCartData(null);
      toast.success('Cart cleared');
    } catch (err) {
      toast.error('Failed to clear cart');
    }
  };

  const items = cartData?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton width="30%" height={45} sx={{ mb: 3 }} />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="rectangular" height={140} sx={{ mb: 2, borderRadius: 3 }} />
        ))}
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ bgcolor: '#F8F9FE', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <ShoppingCart sx={{ fontSize: 100, color: 'grey.300', mb: 2 }} />
          <Typography variant="h4" fontWeight={800} gutterBottom>Your cart is empty</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Looks like you haven't added anything to your cart yet.
          </Typography>
          <Button component={Link} to="/products" variant="contained" size="large"
            startIcon={<ShoppingBag />} sx={{ px: 4 }}>
            Start Shopping
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F8F9FE', minHeight: '80vh', py: 4 }}>
      <Container maxWidth="xl">
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
          <Typography component={Link} to="/" color="inherit" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
            Home
          </Typography>
          <Typography color="text.primary" fontWeight={600}>Shopping Cart</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={800}>
            Shopping Cart <Chip label={`${items.length} items`} size="small" color="primary" sx={{ ml: 1 }} />
          </Typography>
          <Button color="error" onClick={handleClearCart} startIcon={<Delete />}>Clear Cart</Button>
        </Box>

        <Grid container spacing={4}>
          {/* Cart Items */}
          <Grid item xs={12} md={8}>
            {items.map((item) => (
              <Box key={item.id} sx={{
                bgcolor: 'white', borderRadius: 3, p: 3, mb: 2,
                display: 'flex', gap: 3, alignItems: 'center',
                border: '1px solid', borderColor: 'divider',
                transition: 'all 0.2s',
                opacity: updating === item.id ? 0.6 : 1,
                '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
              }}>
                {/* Product Image */}
                <Box sx={{
                  width: 120, height: 120, borderRadius: 2, overflow: 'hidden',
                  bgcolor: 'grey.100', flexShrink: 0,
                }}>
                  {item.imageUrl ? (
                    <Box component="img" src={item.imageUrl} alt={item.productName}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'grey.300' }}>
                      📦
                    </Box>
                  )}
                </Box>

                {/* Product Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography component={Link} to={`/products/${item.productSlug || ''}`}
                    variant="subtitle1" fontWeight={600}
                    sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' },
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {item.productName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Unit price: ₹{item.price}
                  </Typography>

                  {/* Quantity Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updating === item.id}
                      sx={{ border: '1px solid', borderColor: 'divider', width: 32, height: 32 }}>
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography sx={{ px: 1.5, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton size="small" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                      sx={{ border: '1px solid', borderColor: 'divider', width: 32, height: 32 }}>
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Price + Remove */}
                <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <Typography variant="h6" fontWeight={800} color="primary.main">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Typography>
                  <IconButton color="error" size="small" onClick={() => handleRemoveItem(item.id)}
                    disabled={updating === item.id}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Box sx={{
              bgcolor: 'white', borderRadius: 3, p: 3, position: 'sticky', top: 100,
              border: '1px solid', borderColor: 'divider',
            }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Order Summary</Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Subtotal ({items.length} items)</Typography>
                <Typography fontWeight={600}>₹{subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Shipping</Typography>
                <Typography fontWeight={600} color={shipping === 0 ? 'success.main' : 'text.primary'}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </Typography>
              </Box>
              {shipping > 0 && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2, py: 0 }} icon={<LocalShipping fontSize="small" />}>
                  <Typography variant="caption">
                    Add ₹{(500 - subtotal).toFixed(0)} more for free shipping
                  </Typography>
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>Total</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main">₹{total.toFixed(2)}</Typography>
              </Box>

              <Button variant="contained" fullWidth size="large" endIcon={<ArrowForward />}
                onClick={() => navigate('/checkout')} sx={{ py: 1.5, fontSize: '1rem' }}>
                Proceed to Checkout
              </Button>

              <Button component={Link} to="/products" fullWidth sx={{ mt: 1 }} color="inherit">
                Continue Shopping
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Cart;
