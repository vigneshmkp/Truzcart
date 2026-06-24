import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Container, Typography, Grid, Button, Chip, Rating, Breadcrumbs,
  IconButton, Divider, Skeleton, Alert, Tabs, Tab, TextField, Avatar,
  CircularProgress, LinearProgress
} from '@mui/material';
import {
  ShoppingCart, Add, Remove, NavigateNext, FavoriteBorder, Favorite,
  LocalShipping, Verified, Replay
} from '@mui/icons-material';
import { productService, cartService, reviewService, wishlistService } from '../services/api';
import { selectIsAuthenticated } from '../store/authSlice';
import { toast } from 'react-toastify';

function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [tab, setTab] = useState(0);

  // Wishlist state
  const [inWishlist, setInWishlist] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getBySlug(slug);
        setProduct(res.data?.data);
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // Check wishlist status
  useEffect(() => {
    if (product && isAuthenticated) {
      wishlistService.check(product.id).then(res => setInWishlist(res.data?.data)).catch(() => {});
    }
  }, [product, isAuthenticated]);

  // Fetch reviews when Reviews tab opens
  useEffect(() => {
    if (tab === 2 && product) fetchReviews();
  }, [tab, product]);

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await reviewService.getProductReviews(product.id, 0, 20);
      setReviews(res.data?.data?.content || []);
    } catch (err) { console.error(err); }
    finally { setReviewsLoading(false); }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAddingToCart(true);
    try {
      await cartService.addItem(product.id, quantity);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (inWishlist) {
        await wishlistService.remove(product.id);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.add(product.id);
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update wishlist'); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    setSubmittingReview(true);
    try {
      await reviewService.addReview({ productId: product.id, ...reviewForm });
      toast.success('Review submitted for approval!');
      setReviewForm({ rating: 5, title: '', comment: '' });
      fetchReviews();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit review'); }
    finally { setSubmittingReview(false); }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}><Skeleton variant="rectangular" height={500} sx={{ borderRadius: 3 }} /></Grid>
          <Grid item xs={12} md={6}>
            <Skeleton width="40%" height={30} /><Skeleton width="80%" height={45} sx={{ mt: 2 }} />
            <Skeleton width="30%" height={40} sx={{ mt: 2 }} /><Skeleton height={100} sx={{ mt: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="xl" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>😕</Typography>
        <Typography variant="h5" fontWeight={700}>Product not found</Typography>
        <Button component={Link} to="/products" variant="contained" sx={{ mt: 3 }}>Browse Products</Button>
      </Container>
    );
  }

  const images = product.images?.length > 0 ? product.images : [{ imageUrl: null }];

  return (
    <Box sx={{ bgcolor: '#F8F9FE', minHeight: '80vh', py: 4 }}>
      <Container maxWidth="xl">
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
          <Typography component={Link} to="/" color="inherit" sx={{ textDecoration: 'none' }}>Home</Typography>
          <Typography component={Link} to="/products" color="inherit" sx={{ textDecoration: 'none' }}>Products</Typography>
          <Typography color="text.primary" fontWeight={600}>{product.name}</Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          {/* Image Gallery */}
          <Grid item xs={12} md={6}>
            <Box sx={{
              position: 'relative', borderRadius: 4, overflow: 'hidden',
              bgcolor: 'white', border: '1px solid', borderColor: 'divider',
            }}>
              <Box sx={{ pt: '100%', position: 'relative' }}>
                {images[selectedImage]?.imageUrl ? (
                  <Box component="img" src={images[selectedImage].imageUrl} alt={product.name}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', p: 3 }} />
                ) : (
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem', color: 'grey.300',
                  }}>
                    📦
                  </Box>
                )}
                {product.discountPercentage > 0 && (
                  <Chip label={`${Math.round(product.discountPercentage)}% OFF`}
                    sx={{ position: 'absolute', top: 16, left: 16, bgcolor: 'error.main', color: 'white', fontWeight: 700, fontSize: '0.9rem' }} />
                )}
              </Box>
            </Box>
            {images.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1.5, mt: 2, overflowX: 'auto' }}>
                {images.map((img, i) => (
                  <Box key={i} onClick={() => setSelectedImage(i)}
                    sx={{
                      width: 72, height: 72, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                      border: '2px solid', borderColor: selectedImage === i ? 'primary.main' : 'divider',
                      transition: 'all 0.2s',
                    }}>
                    <Box component="img" src={img.imageUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Box>
            )}
          </Grid>

          {/* Product Info */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'sticky', top: 100 }}>
              {product.brand && <Chip label={product.brand} variant="outlined" size="small" sx={{ mb: 1 }} />}
              <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2, mb: 1 }}>
                {product.name}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Rating value={Number(product.averageRating) || 0} precision={0.5} readOnly />
                <Typography variant="body2" color="text.secondary">
                  ({product.reviewCount || 0} reviews)
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 3 }}>
                <Typography variant="h3" fontWeight={800} color="primary.main">₹{product.price}</Typography>
                {product.compareAtPrice && (
                  <Typography variant="h5" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                    ₹{product.compareAtPrice}
                  </Typography>
                )}
                {product.discountPercentage > 0 && (
                  <Chip label={`Save ${Math.round(product.discountPercentage)}%`}
                    color="success" size="small" sx={{ fontWeight: 700 }} />
                )}
              </Box>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                {product.shortDescription || product.description?.substring(0, 200)}
              </Typography>

              {/* Stock Status */}
              <Alert
                severity={product.inStock ? 'success' : 'error'}
                icon={product.inStock ? <Verified /> : undefined}
                sx={{ mb: 3, borderRadius: 2 }}
              >
                {product.inStock
                  ? `In Stock — ${product.stockQuantity} available`
                  : 'Out of Stock'}
              </Alert>

              {/* Quantity + Add to Cart */}
              {product.inStock && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider',
                    borderRadius: 2, overflow: 'hidden',
                  }}>
                    <IconButton onClick={() => setQuantity(Math.max(1, quantity - 1))} size="small"><Remove /></IconButton>
                    <Typography sx={{ px: 2, fontWeight: 700, minWidth: 40, textAlign: 'center' }}>{quantity}</Typography>
                    <IconButton onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))} size="small"><Add /></IconButton>
                  </Box>
                  <Button variant="contained" size="large" startIcon={<ShoppingCart />}
                    onClick={handleAddToCart} disabled={addingToCart}
                    sx={{ flex: 1, py: 1.5, fontSize: '1rem' }}>
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <IconButton onClick={handleWishlistToggle}
                    sx={{ border: '1px solid', borderColor: inWishlist ? 'error.main' : 'divider', borderRadius: 2,
                      color: inWishlist ? 'error.main' : 'inherit' }}>
                    {inWishlist ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                </Box>
              )}

              {/* Trust Items */}
              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                {[
                  { icon: <LocalShipping fontSize="small" />, text: 'Free shipping above ₹500' },
                  { icon: <Replay fontSize="small" />, text: '7-day returns' },
                  { icon: <Verified fontSize="small" />, text: '100% genuine' },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                    <Typography variant="caption" color="text.secondary">{item.text}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Description Tabs */}
        <Box sx={{ mt: 6, bgcolor: 'white', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tab label="Description" />
            <Tab label="Specifications" />
            <Tab label={`Reviews (${product.reviewCount || 0})`} />
          </Tabs>
          <Box sx={{ p: 4 }}>
            {tab === 0 && (
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {product.description || 'No description available.'}
              </Typography>
            )}
            {tab === 1 && (
              <Grid container spacing={2}>
                {[
                  { label: 'SKU', value: product.sku },
                  { label: 'Brand', value: product.brand || 'N/A' },
                  { label: 'Weight', value: product.weight ? `${product.weight} kg` : 'N/A' },
                  { label: 'Dimensions', value: product.dimensions || 'N/A' },
                  { label: 'Category', value: product.categoryName || 'N/A' },
                ].map((spec) => (
                  <Grid item xs={6} key={spec.label}>
                    <Typography variant="caption" color="text.secondary">{spec.label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{spec.value}</Typography>
                  </Grid>
                ))}
              </Grid>
            )}
            {tab === 2 && (
              <Box>
                {/* Rating Summary */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" fontWeight={800}>{Number(product.averageRating || 0).toFixed(1)}</Typography>
                    <Rating value={Number(product.averageRating) || 0} precision={0.1} readOnly />
                    <Typography variant="body2" color="text.secondary">{product.reviewCount || 0} reviews</Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Write a Review */}
                {isAuthenticated && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Write a Review</Typography>
                    <Box component="form" onSubmit={handleSubmitReview}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="body2">Your Rating:</Typography>
                        <Rating value={reviewForm.rating} onChange={(_, v) => setReviewForm(f => ({ ...f, rating: v }))} />
                      </Box>
                      <TextField fullWidth label="Title (optional)" value={reviewForm.title}
                        onChange={(e) => setReviewForm(f => ({ ...f, title: e.target.value }))}
                        sx={{ mb: 2 }} size="small" />
                      <TextField fullWidth label="Your review" multiline rows={3} value={reviewForm.comment}
                        onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        sx={{ mb: 2 }} size="small" />
                      <Button type="submit" variant="contained" disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </Box>
                    <Divider sx={{ mt: 3 }} />
                  </Box>
                )}

                {/* Review List */}
                {reviewsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
                ) : reviews.length === 0 ? (
                  <Typography color="text.secondary">No reviews yet. Be the first to review this product!</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {reviews.map((r) => (
                      <Box key={r.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem',
                            background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}>
                            {r.userName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" fontWeight={600}>{r.userName}</Typography>
                              {r.isVerifiedPurchase && (
                                <Chip label="Verified Purchase" size="small" color="success" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Rating value={r.rating} size="small" readOnly sx={{ mb: 0.5 }} />
                        {r.title && <Typography variant="subtitle2" fontWeight={600}>{r.title}</Typography>}
                        <Typography variant="body2" color="text.secondary">{r.comment}</Typography>
                        <Divider sx={{ mt: 2 }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default ProductDetail;
