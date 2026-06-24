import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TextField, MenuItem, Pagination, IconButton,
  Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Collapse, Divider, InputAdornment, Alert
} from '@mui/material';
import {
  Search, ExpandMore, ExpandLess, ShoppingCart,
  LocalShipping, CheckCircle, Cancel, HourglassTop
} from '@mui/icons-material';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = [
  { value: 'CONFIRMED', label: 'Confirm', color: 'info' },
  { value: 'PROCESSING', label: 'Processing', color: 'info' },
  { value: 'SHIPPED', label: 'Ship', color: 'primary' },
  { value: 'DELIVERED', label: 'Deliver', color: 'success' },
  { value: 'CANCELLED', label: 'Cancel', color: 'error' },
];

const STATUS_CONFIG = {
  PENDING: { color: 'warning', label: 'Pending', icon: <HourglassTop fontSize="small" /> },
  CONFIRMED: { color: 'info', label: 'Confirmed', icon: <CheckCircle fontSize="small" /> },
  PROCESSING: { color: 'info', label: 'Processing', icon: <ShoppingCart fontSize="small" /> },
  SHIPPED: { color: 'primary', label: 'Shipped', icon: <LocalShipping fontSize="small" /> },
  DELIVERED: { color: 'success', label: 'Delivered', icon: <CheckCircle fontSize="small" /> },
  CANCELLED: { color: 'error', label: 'Cancelled', icon: <Cancel fontSize="small" /> },
  REFUNDED: { color: 'default', label: 'Refunded', icon: <Cancel fontSize="small" /> },
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updateDialog, setUpdateDialog] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllOrders(page, 20, statusFilter);
      setOrders(res.data?.data?.content || []);
      setTotalPages(res.data?.data?.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!updateDialog || !newStatus) return;
    setUpdating(true);
    try {
      await adminService.updateOrderStatus(updateDialog, newStatus, notes);
      toast.success(`Order status updated to ${newStatus}`);
      setUpdateDialog(null);
      setNewStatus('');
      setNotes('');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatuses = (currentStatus) => {
    const flow = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };
    return flow[currentStatus] || [];
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Orders</Typography>
          <Typography color="text.secondary">Manage customer orders</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField select size="small" label="Status Filter" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 180 }}>
          <MenuItem value="">All Orders</MenuItem>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <MenuItem key={key} value={key}>{val.label}</MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          Showing {orders.length} orders
        </Typography>
      </Paper>

      {/* Orders Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8F9FE' }}>
              {['', 'Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                  <ShoppingCart sx={{ fontSize: 60, color: 'grey.300', mb: 1 }} />
                  <Typography variant="h6" fontWeight={700}>No orders found</Typography>
                  <Typography color="text.secondary">
                    {statusFilter ? `No ${STATUS_CONFIG[statusFilter]?.label?.toLowerCase()} orders` : 'No orders yet'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map(order => {
                const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const isExpanded = expandedOrder === order.id;
                const nextStatuses = getNextStatuses(order.status);

                return (
                  <>
                    <TableRow key={order.id} hover sx={{
                      '&:hover': { bgcolor: 'grey.50' },
                      cursor: 'pointer',
                    }}>
                      <TableCell sx={{ width: 40 }}>
                        <IconButton size="small" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                          {order.orderNumber || `#${order.id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {order.customerName || order.userName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customerEmail || order.userEmail || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{order.items?.length || order.itemCount || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
                          size="small" color={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                          sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Chip icon={config.icon} label={config.label} color={config.color}
                          size="small" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: '2-digit',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {nextStatuses.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {nextStatuses.map(s => {
                              const opt = STATUS_OPTIONS.find(o => o.value === s);
                              return opt ? (
                                <Button key={s} size="small" variant="outlined" color={opt.color}
                                  onClick={(e) => { e.stopPropagation(); setUpdateDialog(order.id); setNewStatus(s); }}
                                  sx={{ fontSize: '0.7rem', py: 0.3, minWidth: 0, px: 1 }}>
                                  {opt.label}
                                </Button>
                              ) : null;
                            })}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row */}
                    <TableRow>
                      <TableCell colSpan={9} sx={{ py: 0, border: isExpanded ? undefined : 'none' }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, bgcolor: '#FAFBFF' }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Order Items</Typography>
                            {(order.items || []).map((item, i) => (
                              <Box key={i} sx={{
                                display: 'flex', gap: 2, py: 1, alignItems: 'center',
                                borderBottom: i < (order.items?.length || 0) - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                              }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'grey.200', overflow: 'hidden', flexShrink: 0 }}>
                                  {item.imageUrl ? (
                                    <Box component="img" src={item.imageUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>📦</Box>
                                  )}
                                </Box>
                                <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{item.productName}</Typography>
                                <Typography variant="body2" color="text.secondary">×{item.quantity}</Typography>
                                <Typography variant="body2" fontWeight={700}>₹{(item.price * item.quantity).toFixed(2)}</Typography>
                              </Box>
                            ))}
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', gap: 4 }}>
                              {order.shippingAddress && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={700}>SHIPPING ADDRESS</Typography>
                                  <Typography variant="body2">{order.shippingAddress}</Typography>
                                </Box>
                              )}
                              {order.shippingPhone && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={700}>PHONE</Typography>
                                  <Typography variant="body2">{order.shippingPhone}</Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)}
            color="primary" shape="rounded" />
        </Box>
      )}

      {/* Status Update Dialog */}
      <Dialog open={!!updateDialog} onClose={() => setUpdateDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Order Status</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Change status to: <strong>{STATUS_CONFIG[newStatus]?.label || newStatus}</strong>
          </Alert>
          <TextField fullWidth label="Notes (optional)" value={notes}
            onChange={(e) => setNotes(e.target.value)} multiline rows={2}
            placeholder="Add a note about this status change..." />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => { setUpdateDialog(null); setNewStatus(''); setNotes(''); }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdateStatus} disabled={updating || !newStatus}
            color={newStatus === 'CANCELLED' ? 'error' : 'primary'}>
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminOrders;
