import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardMedia, CardContent, CardActions,
  Button, IconButton, Chip, CircularProgress, Alert
} from '@mui/material';
import { Delete, ShoppingCart, Favorite } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { wishlistService, cartService } from '../../services/api';

function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => { fetchWishlist(); }, [page]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await wishlistService.getWishlist(page, 20);
      const data = res.data?.data;
      setItems(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch (err) { toast.error('Failed to load wishlist'); }
    finally { setLoading(false); }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistService.remove(productId);
      setItems(items.filter(i => i.productId !== productId));
      toast.success('Removed from wishlist');
    } catch (err) { toast.error('Failed to remove item'); }
  };

  const handleAddToCart = async (productId) => {
    try {
      await cartService.addItem(productId, 1);
      toast.success('Added to cart');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add to cart'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <Favorite color="error" />
        <Typography variant="h4" fontWeight={800}>My Wishlist</Typography>
        <Chip label={`${items.length} items`} sx={{ ml: 1 }} />
      </Box>

      {items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Favorite sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>Your wishlist is empty</Typography>
          <Typography color="text.secondary" gutterBottom>
            Start browsing and save products you love!
          </Typography>
          <Button component={Link} to="/products" variant="contained" sx={{ mt: 2 }}>Browse Products</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={6} sm={4} md={3} key={item.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <IconButton size="small" onClick={() => handleRemove(item.productId)}
                  sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', zIndex: 1,
                    '&:hover': { bgcolor: 'error.light', color: 'white' } }}>
                  <Delete fontSize="small" />
                </IconButton>

                <Box component={Link} to={`/products/${item.productSlug}`}
                  sx={{ textDecoration: 'none', position: 'relative', pt: '100%', bgcolor: 'grey.100' }}>
                  {item.productImage && (
                    <CardMedia component="img" image={item.productImage} alt={item.productName}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {!item.inStock && (
                    <Chip label="Out of Stock" size="small"
                      sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'grey.800', color: 'white' }} />
                  )}
                </Box>

                <CardContent sx={{ flex: 1, pb: 0 }}>
                  <Typography variant="subtitle2" fontWeight={600}
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {item.productName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
                    <Typography variant="h6" fontWeight={800} color="primary.main">₹{item.productPrice}</Typography>
                    {item.compareAtPrice && (
                      <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        ₹{item.compareAtPrice}
                      </Typography>
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button fullWidth variant="contained" size="small" startIcon={<ShoppingCart />}
                    disabled={!item.inStock || !item.isActive}
                    onClick={() => handleAddToCart(item.productId)}>
                    {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 1 }}>
          <Button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            Page {page + 1} of {totalPages}
          </Typography>
          <Button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </Box>
      )}
    </Container>
  );
}

export default Wishlist;
