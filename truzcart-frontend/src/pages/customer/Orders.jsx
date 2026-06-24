import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Container, Typography, Breadcrumbs, Chip, Card, Button,
  Skeleton, Pagination, Tabs, Tab, Divider, IconButton, Collapse,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import {
  NavigateNext, ShoppingBag, LocalShipping, CheckCircle, Cancel,
  ExpandMore, ExpandLess, Visibility, Receipt
} from '@mui/icons-material';
import { orderService } from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_CONFIG = {
  PENDING: { color: 'warning', label: 'Pending', icon: <Receipt fontSize="small" /> },
  CONFIRMED: { color: 'info', label: 'Confirmed', icon: <CheckCircle fontSize="small" /> },
  PROCESSING: { color: 'info', label: 'Processing', icon: <ShoppingBag fontSize="small" /> },
  SHIPPED: { color: 'primary', label: 'Shipped', icon: <LocalShipping fontSize="small" /> },
  DELIVERED: { color: 'success', label: 'Delivered', icon: <CheckCircle fontSize="small" /> },
  CANCELLED: { color: 'error', label: 'Cancelled', icon: <Cancel fontSize="small" /> },
  REFUNDED: { color: 'default', label: 'Refunded', icon: <Receipt fontSize="small" /> },
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [tab, setTab] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyOrders(page, 10);
      setOrders(res.data?.data?.content || []);
      setTotalPages(res.data?.data?.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page]);

  const handleCancel = async () => {
    if (!cancelDialog) return;
    setCancelling(true);
    try {
      await orderService.cancel(cancelDialog);
      toast.success('Order cancelled successfully');
      setCancelDialog(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const filteredOrders = tab === 0 ? orders : orders.filter(o => {
    if (tab === 1) return ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status);
    if (tab === 2) return o.status === 'SHIPPED';
    if (tab === 3) return o.status === 'DELIVERED';
    if (tab === 4) return ['CANCELLED', 'REFUNDED'].includes(o.status);
    return true;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton width="30%" height={45} sx={{ mb: 3 }} />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="rectangular" height={160} sx={{ mb: 2, borderRadius: 3 }} />
        ))}
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F8F9FE', minHeight: '80vh', py: 4 }}>
      <Container maxWidth="lg">
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
          <Typography component={Link} to="/" color="inherit" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
            Home
          </Typography>
          <Typography color="text.primary" fontWeight={600}>My Orders</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={800} gutterBottom>My Orders</Typography>

        {/* Filter Tabs */}
        <Box sx={{ bgcolor: 'white', borderRadius: 3, mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
            <Tab label="All Orders" />
            <Tab label="Active" />
            <Tab label="Shipped" />
            <Tab label="Delivered" />
            <Tab label="Cancelled" />
          </Tabs>
        </Box>

        {filteredOrders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <ShoppingBag sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>No orders found</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {tab === 0 ? "You haven't placed any orders yet." : "No orders matching this filter."}
            </Typography>
            <Button component={Link} to="/products" variant="contained" size="large">
              Start Shopping
            </Button>
          </Box>
        ) : (
          filteredOrders.map(order => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const isExpanded = expandedOrder === order.id;
            const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

            return (
              <Card key={order.id} sx={{ mb: 2, borderRadius: 3, overflow: 'visible' }}>
                {/* Order Header */}
                <Box sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  p: 3, flexWrap: 'wrap', gap: 2,
                }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Order #{order.orderNumber || order.id}
                      </Typography>
                      <Chip icon={config.icon} label={config.label} color={config.color}
                        size="small" sx={{ fontWeight: 600 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">Total</Typography>
                      <Typography variant="h6" fontWeight={800} color="primary.main">
                        ₹{order.totalAmount?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                    {canCancel && (
                      <Button color="error" size="small" variant="outlined"
                        onClick={() => setCancelDialog(order.id)}>
                        Cancel
                      </Button>
                    )}
                    <IconButton onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                </Box>

                {/* Order Items (collapsed preview) */}
                {!isExpanded && (
                  <Box sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(order.items || []).slice(0, 4).map((item, i) => (
                      <Box key={i} sx={{
                        width: 48, height: 48, borderRadius: 1.5, bgcolor: 'grey.100',
                        overflow: 'hidden', border: '1px solid', borderColor: 'divider',
                      }}>
                        {item.imageUrl ? (
                          <Box component="img" src={item.imageUrl} alt=""
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</Box>
                        )}
                      </Box>
                    ))}
                    {(order.items?.length || 0) > 4 && (
                      <Chip label={`+${order.items.length - 4} more`} size="small" variant="outlined" />
                    )}
                  </Box>
                )}

                {/* Expanded Details */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Order Items</Typography>
                    {(order.items || []).map((item, i) => (
                      <Box key={i} sx={{
                        display: 'flex', gap: 2, py: 1.5,
                        borderBottom: i < order.items.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}>
                        <Box sx={{
                          width: 64, height: 64, borderRadius: 2, bgcolor: 'grey.100',
                          overflow: 'hidden', flexShrink: 0,
                        }}>
                          {item.imageUrl ? (
                            <Box component="img" src={item.imageUrl} alt={item.productName}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</Box>
                          )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{item.productName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Qty: {item.quantity} × ₹{item.price}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={700}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}

                    <Divider sx={{ my: 2 }} />

                    {order.shippingAddress && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          <LocalShipping fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
                          Shipping Address
                        </Typography>
                        <Typography variant="body2" color="text.secondary">{order.shippingAddress}</Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Payment</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order.paymentStatus === 'PAID' ? '✅ Paid' : '⏳ Pending'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">Order Total</Typography>
                        <Typography variant="h6" fontWeight={800} color="primary.main">
                          ₹{order.totalAmount?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Collapse>
              </Card>
            );
          })
        )}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination count={totalPages} page={page + 1}
              onChange={(_, v) => setPage(v - 1)} color="primary" shape="rounded" />
          </Box>
        )}
      </Container>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialog} onClose={() => setCancelDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Cancel Order?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            This action cannot be undone. Are you sure you want to cancel this order?
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCancelDialog(null)}>Keep Order</Button>
          <Button variant="contained" color="error" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Orders;
