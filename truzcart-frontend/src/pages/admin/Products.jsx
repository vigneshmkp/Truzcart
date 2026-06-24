import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Switch,
  Pagination, Skeleton, InputAdornment, FormControlLabel, Alert
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Inventory, ToggleOn,
  ToggleOff, Close
} from '@mui/icons-material';
import { adminService, categoryService, productService } from '../../services/api';
import { toast } from 'react-toastify';

const EMPTY_PRODUCT = {
  name: '', description: '', shortDescription: '', price: '', compareAtPrice: '',
  sku: '', brand: '', weight: '', dimensions: '', stockQuantity: '',
  categoryId: '', featured: false, active: true,
};

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [stockDialog, setStockDialog] = useState(null);
  const [stockQty, setStockQty] = useState('');
  const [stockReason, setStockReason] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let res;
      if (searchQuery) {
        res = await productService.search(searchQuery, page, 20);
      } else {
        res = await productService.getAll(page, 20, 'createdAt', 'desc');
      }
      setProducts(res.data?.data?.content || []);
      setTotalPages(res.data?.data?.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, searchQuery]);

  useEffect(() => {
    categoryService.getFlat().then(res => setCategories(res.data?.data || [])).catch(() => {});
  }, []);

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price || '',
        compareAtPrice: product.compareAtPrice || '',
        sku: product.sku || '',
        brand: product.brand || '',
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        stockQuantity: product.stockQuantity || '',
        categoryId: product.categoryId || '',
        featured: product.featured || false,
        active: product.active !== false,
      });
    } else {
      setEditProduct(null);
      setFormData(EMPTY_PRODUCT);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editProduct) {
        await adminService.updateProduct(editProduct.id, formData);
        toast.success('Product updated');
      } else {
        await adminService.createProduct(formData);
        toast.success('Product created');
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await adminService.deleteProduct(deleteDialog);
      toast.success('Product deleted');
      setDeleteDialog(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await adminService.toggleProductStatus(id);
      toast.success('Product status updated');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateStock = async () => {
    if (!stockDialog || !stockQty) return;
    try {
      await adminService.updateStock(stockDialog, parseInt(stockQty), stockReason || 'Manual adjustment');
      toast.success('Stock updated');
      setStockDialog(null);
      setStockQty('');
      setStockReason('');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleFormChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Products</Typography>
          <Typography color="text.secondary">Manage your product catalog</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}
          sx={{ px: 3, py: 1.2 }}>
          Add Product
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField placeholder="Search products..." size="small" fullWidth
          value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ maxWidth: 400 }}
        />
        <Typography variant="body2" color="text.secondary">
          {products.length} products
        </Typography>
      </Paper>

      {/* Product Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8F9FE' }}>
              {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
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
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                  <Inventory sx={{ fontSize: 60, color: 'grey.300', mb: 1 }} />
                  <Typography variant="h6" fontWeight={700}>No products found</Typography>
                  <Typography color="text.secondary">Create your first product to get started</Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map(product => (
                <TableRow key={product.id} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 48, height: 48, borderRadius: 2, bgcolor: 'grey.100',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {product.images?.[0]?.imageUrl ? (
                          <Box component="img" src={product.images[0].imageUrl} alt=""
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</Box>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                          {product.name}
                        </Typography>
                        {product.brand && (
                          <Typography variant="caption" color="text.secondary">{product.brand}</Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">{product.sku || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={product.categoryName || '—'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>₹{product.price}</Typography>
                    {product.compareAtPrice && (
                      <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        ₹{product.compareAtPrice}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={product.stockQuantity || 0}
                      size="small"
                      color={product.stockQuantity <= 5 ? 'error' : product.stockQuantity <= 20 ? 'warning' : 'success'}
                      sx={{ fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setStockDialog(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color={product.active !== false ? 'success' : 'default'}
                      onClick={() => handleToggleStatus(product.id)}>
                      {product.active !== false ? <ToggleOn /> : <ToggleOff />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(product)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog(product.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            {editProduct ? 'Edit Product' : 'Add New Product'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Product Name" required value={formData.name}
                onChange={handleFormChange('name')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Short Description" value={formData.shortDescription}
                onChange={handleFormChange('shortDescription')} multiline rows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Full Description" value={formData.description}
                onChange={handleFormChange('description')} multiline rows={4} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Price (₹)" type="number" required value={formData.price}
                onChange={handleFormChange('price')} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Compare Price" type="number" value={formData.compareAtPrice}
                onChange={handleFormChange('compareAtPrice')} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="SKU" value={formData.sku}
                onChange={handleFormChange('sku')} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Stock Quantity" type="number" value={formData.stockQuantity}
                onChange={handleFormChange('stockQuantity')} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Brand" value={formData.brand}
                onChange={handleFormChange('brand')} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Category" value={formData.categoryId}
                onChange={handleFormChange('categoryId')}>
                <MenuItem value="">Select Category</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Weight (kg)" value={formData.weight}
                onChange={handleFormChange('weight')} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Dimensions" value={formData.dimensions}
                onChange={handleFormChange('dimensions')} placeholder="L × W × H cm" />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={
                <Switch checked={formData.featured} onChange={handleFormChange('featured')} />
              } label="Featured Product" />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={
                <Switch checked={formData.active} onChange={handleFormChange('active')} />
              } label="Active" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !formData.name || !formData.price}>
            {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Product?</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            This will permanently delete the product and all its associated data.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Stock Update Dialog */}
      <Dialog open={!!stockDialog} onClose={() => setStockDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Stock</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Quantity Change" type="number" value={stockQty}
            onChange={(e) => setStockQty(e.target.value)} sx={{ mt: 1, mb: 2 }}
            helperText="Use negative numbers to reduce stock" />
          <TextField fullWidth label="Reason" value={stockReason}
            onChange={(e) => setStockReason(e.target.value)}
            placeholder="e.g., New shipment received" />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setStockDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateStock} disabled={!stockQty}>
            Update Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminProducts;
