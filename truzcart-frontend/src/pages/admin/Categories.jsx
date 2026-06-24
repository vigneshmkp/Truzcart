import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Paper, Grid, Card, CardContent,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Skeleton, Alert, Switch, FormControlLabel
} from '@mui/material';
import {
  Add, Edit, Delete, Close, Category as CategoryIcon,
  FolderOpen
} from '@mui/icons-material';
import { adminService, categoryService } from '../../services/api';
import { toast } from 'react-toastify';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', imageUrl: '', active: true });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAll();
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleOpenDialog = (cat = null) => {
    if (cat) {
      setEditCategory(cat);
      setFormData({
        name: cat.name || '',
        description: cat.description || '',
        imageUrl: cat.imageUrl || '',
        active: cat.active !== false,
      });
    } else {
      setEditCategory(null);
      setFormData({ name: '', description: '', imageUrl: '', active: true });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editCategory) {
        await adminService.updateCategory(editCategory.id, formData);
        toast.success('Category updated');
      } else {
        await adminService.createCategory(formData);
        toast.success('Category created');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await adminService.deleteCategory(deleteDialog);
      toast.success('Category deleted');
      setDeleteDialog(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const flattenCategories = (cats, depth = 0) => {
    const result = [];
    for (const cat of cats) {
      result.push({ ...cat, depth });
      if (cat.subcategories?.length) {
        result.push(...flattenCategories(cat.subcategories, depth + 1));
      }
    }
    return result;
  };

  const flatList = flattenCategories(categories);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Categories</Typography>
          <Typography color="text.secondary">Organize your product catalog</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}
          sx={{ px: 3, py: 1.2 }}>
          Add Category
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : flatList.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <FolderOpen sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>No categories yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create your first category to start organizing products
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Create Category
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {flatList.map(cat => (
            <Grid item xs={12} sm={6} md={4} key={cat.id}>
              <Card sx={{
                borderRadius: 3, position: 'relative', overflow: 'visible',
                ml: cat.depth * 3,
                borderLeft: cat.depth > 0 ? '3px solid' : 'none',
                borderColor: cat.depth > 0 ? 'primary.light' : 'transparent',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 48, height: 48, borderRadius: 2, overflow: 'hidden',
                        bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #6C63FF20, #FF658420)',
                      }}>
                        {cat.imageUrl ? (
                          <Box component="img" src={cat.imageUrl} alt={cat.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <CategoryIcon sx={{ color: 'primary.main' }} />
                        )}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{cat.name}</Typography>
                        {cat.depth > 0 && (
                          <Chip label="Subcategory" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(cat)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog(cat.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {cat.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.5 }}>
                      {cat.description.length > 80 ? cat.description.substring(0, 80) + '...' : cat.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip label={`${cat.productCount || 0} products`} size="small" sx={{ fontWeight: 600 }} />
                    <Chip label={cat.active !== false ? 'Active' : 'Inactive'} size="small"
                      color={cat.active !== false ? 'success' : 'default'} variant="outlined" sx={{ fontWeight: 600 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            {editCategory ? 'Edit Category' : 'Add New Category'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Category Name" required value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline rows={3} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Image URL" value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..." />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={
                <Switch checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))} />
              } label="Active" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !formData.name}>
            {saving ? 'Saving...' : editCategory ? 'Update Category' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Category?</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            This will remove the category. Products under this category will become uncategorized.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminCategories;
