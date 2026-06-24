import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, Container, Typography, Grid, Button, TextField, Divider,
  Breadcrumbs, Stepper, Step, StepLabel, Paper, Alert, CircularProgress
} from '@mui/material';
import {
  NavigateNext, LocationOn, CreditCard, CheckCircle, ArrowBack,
  ArrowForward, LocalShipping, Lock, LocalOffer, Close
} from '@mui/icons-material';
import { cartService, orderService, paymentService, couponService } from '../../services/api';
import { clearCart } from '../../store/cartSlice';
import { toast } from 'react-toastify';

const steps = ['Delivery Address', 'Review Order', 'Payment'];

function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [address, setAddress] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', country: 'India',
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await cartService.getCart();
        const data = res.data?.data;
        if (!data?.items?.length) {
          navigate('/cart');
          return;
        }
        setCartData(data);
      } catch (err) {
        toast.error('Failed to load cart');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [navigate]);

  const handleAddressChange = (field) => (e) => {
    setAddress(prev => ({ ...prev, [field]: e.target.value }));
  };

  const isAddressValid = () => {
    return address.fullName && address.phone && address.addressLine1 &&
      address.city && address.state && address.postalCode;
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const orderData = {
        shippingAddress: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`,
        shippingCity: address.city,
        shippingState: address.state,
        shippingPostalCode: address.postalCode,
        shippingCountry: address.country,
        shippingPhone: address.phone,
        notes: '',
      };
      const res = await orderService.create(orderData);
      const newOrderId = res.data?.data?.id;
      setOrderId(newOrderId);
      dispatch(clearCart());
      setActiveStep(2);
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const handlePayment = async () => {
    if (!orderId) return;
    try {
      const res = await paymentService.create(orderId);
      const paymentData = res.data?.data;

      if (paymentData?.razorpayOrderId && window.Razorpay) {
        const options = {
          key: paymentData.razorpayKeyId,
          amount: paymentData.amount,
          currency: 'INR',
          name: 'TruzCart',
          description: `Order #${orderId}`,
          order_id: paymentData.razorpayOrderId,
          handler: async (response) => {
            try {
              await paymentService.verify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              toast.success('Payment successful!');
              navigate(`/orders`);
            } catch (err) {
              toast.error('Payment verification failed');
            }
          },
          theme: { color: '#6C63FF' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.info('Payment gateway not configured. Order placed with COD.');
        navigate('/orders');
      }
    } catch (err) {
      toast.error('Payment initialization failed');
    }
  };

  const items = cartData?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const discount = couponValidation?.valid ? Number(couponValidation.calculatedDiscount || 0) : 0;
  const total = subtotal + shipping - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await couponService.validate(couponCode.trim(), subtotal);
      const data = res.data?.data;
      setCouponValidation(data);
      if (data?.valid) {
        toast.success(data.message);
      } else {
        toast.error(data?.message || 'Invalid coupon');
      }
    } catch (err) {
      toast.error('Failed to validate coupon');
      setCouponValidation(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponValidation(null);
    toast.info('Coupon removed');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F8F9FE', minHeight: '80vh', py: 4 }}>
      <Container maxWidth="lg">
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
          <Typography component={Link} to="/" color="inherit" sx={{ textDecoration: 'none' }}>Home</Typography>
          <Typography component={Link} to="/cart" color="inherit" sx={{ textDecoration: 'none' }}>Cart</Typography>
          <Typography color="text.primary" fontWeight={600}>Checkout</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={800} gutterBottom>Checkout</Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4, bgcolor: 'white', p: 3, borderRadius: 3 }}>
          {steps.map((label, i) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    '&.Mui-active': { color: 'primary.main' },
                    '&.Mui-completed': { color: 'success.main' },
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {/* Step 1: Address */}
            {activeStep === 0 && (
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <LocationOn color="primary" />
                  <Typography variant="h6" fontWeight={700}>Delivery Address</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Full Name" required value={address.fullName}
                      onChange={handleAddressChange('fullName')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone Number" required value={address.phone}
                      onChange={handleAddressChange('phone')} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Address Line 1" required value={address.addressLine1}
                      onChange={handleAddressChange('addressLine1')} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Address Line 2 (Optional)" value={address.addressLine2}
                      onChange={handleAddressChange('addressLine2')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="City" required value={address.city}
                      onChange={handleAddressChange('city')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="State" required value={address.state}
                      onChange={handleAddressChange('state')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Postal Code" required value={address.postalCode}
                      onChange={handleAddressChange('postalCode')} />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button startIcon={<ArrowBack />} onClick={() => navigate('/cart')}>Back to Cart</Button>
                  <Button variant="contained" endIcon={<ArrowForward />}
                    disabled={!isAddressValid()} onClick={() => setActiveStep(1)}>
                    Continue to Review
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Step 2: Review */}
            {activeStep === 1 && (
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Review Your Order</Typography>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  Please review your items and delivery address before placing the order.
                </Alert>

                {/* Delivery Address Summary */}
                <Box sx={{ bgcolor: '#F8F9FE', borderRadius: 2, p: 2, mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    <LocationOn fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
                    Delivering to:
                  </Typography>
                  <Typography variant="body2">{address.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {address.city}, {address.state} {address.postalCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Phone: {address.phone}</Typography>
                </Box>

                {/* Items */}
                {items.map(item => (
                  <Box key={item.id} sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 1, bgcolor: 'grey.100', overflow: 'hidden', flexShrink: 0 }}>
                      {item.imageUrl ? (
                        <Box component="img" src={item.imageUrl} alt={item.productName}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</Box>
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{item.productName}</Typography>
                      <Typography variant="caption" color="text.secondary">Qty: {item.quantity} × ₹{item.price}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700}>₹{(item.price * item.quantity).toFixed(2)}</Typography>
                  </Box>
                ))}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button startIcon={<ArrowBack />} onClick={() => setActiveStep(0)}>Edit Address</Button>
                  <Button variant="contained" size="large" onClick={handlePlaceOrder} disabled={placing}
                    startIcon={placing ? <CircularProgress size={20} /> : <Lock />}
                    sx={{ px: 4 }}>
                    {placing ? 'Placing Order...' : 'Place Order'}
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Step 3: Payment */}
            {activeStep === 2 && (
              <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" fontWeight={800} gutterBottom>Order Placed!</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Your order has been placed successfully. You can pay now or later.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button variant="contained" size="large" startIcon={<CreditCard />}
                    onClick={handlePayment} sx={{ px: 4 }}>
                    Pay with Razorpay
                  </Button>
                  <Button variant="outlined" size="large" onClick={() => navigate('/orders')}>
                    View Orders
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>

          {/* Order Summary Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 100 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Order Summary</Typography>
              <Divider sx={{ mb: 2 }} />

              {items.map(item => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%',
                  }}>
                    {item.productName} ×{item.quantity}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>₹{(item.price * item.quantity).toFixed(2)}</Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography fontWeight={600}>₹{subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Shipping</Typography>
                <Typography fontWeight={600} color={shipping === 0 ? 'success.main' : 'text.primary'}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </Typography>
              </Box>

              {/* Coupon Section */}
              {!couponValidation?.valid ? (
                <Box sx={{ mt: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField size="small" fullWidth placeholder="Coupon code" value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      InputProps={{ startAdornment: <LocalOffer sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} /> }} />
                    <Button variant="outlined" onClick={handleApplyCoupon} disabled={validatingCoupon || !couponCode.trim()}
                      sx={{ minWidth: 80 }}>
                      {validatingCoupon ? '...' : 'Apply'}
                    </Button>
                  </Box>
                  {couponValidation && !couponValidation.valid && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {couponValidation.message}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 1,
                  bgcolor: '#F0FFF4', borderRadius: 1, px: 1.5, py: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocalOffer sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {couponValidation.code}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      -₹{discount.toFixed(2)}
                    </Typography>
                    <IconButton size="small" onClick={handleRemoveCoupon}><Close sx={{ fontSize: 16 }} /></IconButton>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>Total</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main">₹{total.toFixed(2)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, p: 1.5, bgcolor: '#F0FFF4', borderRadius: 2 }}>
                <LocalShipping fontSize="small" color="success" />
                <Typography variant="caption" color="success.dark">
                  {shipping === 0 ? 'You qualify for free shipping!' : `₹${(500 - subtotal).toFixed(0)} away from free shipping`}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Checkout;
