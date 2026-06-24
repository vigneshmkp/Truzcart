import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, IconButton, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, MenuItem, CircularProgress, TablePagination
} from '@mui/material';
import { Add, Edit, Delete, LocalOffer } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api';

const emptyForm = {
  code: '', description: '', discountType: 'PERCENTAGE', discountValue: '',
  minOrderAmount: '0', maxDiscount: '', usageLimit: '', validFrom: '', validUntil: '', active: true,
};

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchCoupons(); }, [page, size]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminService.getCoupons(page, size);
      const data = res.data?.data;
      setCoupons(data?.content || []);
      setTotal(data?.totalElements || 0);
    } catch (err) { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  };

  const openDialog = (coupon = null) => {
    if (coupon) {
      setEditing(coupon);
      setForm({
        code: coupon.code, description: coupon.description || '',
        discountType: coupon.discountType, discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount || '0', maxDiscount: coupon.maxDiscount || '',
        usageLimit: coupon.usageLimit || '', validFrom: coupon.validFrom?.slice(0, 16) || '',
        validUntil: coupon.validUntil?.slice(0, 16) || '', active: coupon.active,
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    };
    try {
      if (editing) {
        await adminService.updateCoupon(editing.id, payload);
        toast.success('Coupon updated');
      } else {
        await adminService.createCoupon(payload);
        toast.success('Coupon created');
      }
      setDialogOpen(false);
      fetchCoupons();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save coupon'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await adminService.deleteCoupon(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) { toast.error('Failed to delete coupon'); }
  };

  const getStatusChip = (c) => {
    if (!c.active) return <Chip label="Inactive" size="small" color="default" />;
    if (!c.isValid) return <Chip label="Expired" size="small" color="error" />;
    if (c.usageLimit && c.usedCount >= c.usageLimit) return <Chip label="Exhausted" size="small" color="warning" />;
    return <Chip label="Active" size="small" color="success" />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Coupons</Typography>
          <Typography variant="body2" color="text.secondary">Manage discount coupons</Typography>
        </Box>
        <Button startIcon={<Add />} variant="contained" onClick={() => openDialog()}>Create Coupon</Button>
      </Box>

      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Min Order</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell>Valid Period</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coupons.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalOffer sx={{ color: 'primary.main', fontSize: 18 }} />
                          <Typography fontWeight={600}>{c.code}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                        {c.maxDiscount && <Typography variant="caption" display="block" color="text.secondary">Max: ₹{c.maxDiscount}</Typography>}
                      </TableCell>
                      <TableCell>₹{c.minOrderAmount}</TableCell>
                      <TableCell>{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</TableCell>
                      <TableCell>
                        <Typography variant="caption">{new Date(c.validFrom).toLocaleDateString()}</Typography>
                        <Typography variant="caption" display="block">{new Date(c.validUntil).toLocaleDateString()}</Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(c)}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openDialog(c)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {coupons.length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No coupons found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
              rowsPerPage={size} onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value)); setPage(0); }} />
          </>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Code" value={form.code}
                onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Discount Type" value={form.discountType}
                onChange={(e) => setForm(f => ({ ...f, discountType: e.target.value }))}>
                <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                <MenuItem value="FIXED">Fixed Amount (₹)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Discount Value" type="number" value={form.discountValue}
                onChange={(e) => setForm(f => ({ ...f, discountValue: e.target.value }))} required />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Min Order (₹)" type="number" value={form.minOrderAmount}
                onChange={(e) => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Max Discount (₹)" type="number" value={form.maxDiscount}
                onChange={(e) => setForm(f => ({ ...f, maxDiscount: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Usage Limit" type="number" value={form.usageLimit}
                onChange={(e) => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                helperText="Leave empty for unlimited" />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Valid From" type="datetime-local" value={form.validFrom}
                onChange={(e) => setForm(f => ({ ...f, validFrom: e.target.value }))} required
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Valid Until" type="datetime-local" value={form.validUntil}
                onChange={(e) => setForm(f => ({ ...f, validUntil: e.target.value }))} required
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Coupons;
