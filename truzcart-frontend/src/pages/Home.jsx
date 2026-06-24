import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card, CardMedia, CardContent,
  Chip, Rating, Skeleton, IconButton
} from '@mui/material';
import { ShoppingCart, ArrowForward, LocalShipping, Security, Headset, Payments } from '@mui/icons-material';
import { productService, categoryService } from '../services/api';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productService.getFeatured(0, 8),
          categoryService.getFlat(),
        ]);
        setFeaturedProducts(prodRes.data?.data?.content || []);
        setCategories(catRes.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box>
      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1A1D2E 0%, #2D1B69 50%, #1A1D2E 100%)',
        color: 'white', py: { xs: 8, md: 12 }, position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -100, right: -100, width: 400, height: 400,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.3), transparent)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -80, left: -80, width: 300, height: 300,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,101,132,0.2), transparent)',
        }} />
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="🎉 Free shipping on orders above ₹500" sx={{
                bgcolor: 'rgba(108,99,255,0.2)', color: '#B4AEFF', mb: 3, fontWeight: 600,
              }} />
              <Typography variant="h2" sx={{
                fontSize: { xs: '2.2rem', md: '3.5rem' }, fontWeight: 800,
                lineHeight: 1.15, mb: 2,
              }}>
                Discover Premium{' '}
                <Box component="span" sx={{
                  background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Products</Box>
                <br />at Unbeatable Prices
              </Typography>
              <Typography variant="h6" sx={{ color: 'grey.400', mb: 4, maxWidth: 500, fontWeight: 400 }}>
                From groceries to electronics, clothing to accessories — shop everything you need with secure UPI payments.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button component={Link} to="/products" variant="contained" size="large"
                  endIcon={<ArrowForward />} sx={{ px: 4 }}>
                  Shop Now
                </Button>
                <Button component={Link} to="/register" variant="outlined" size="large"
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', '&:hover': { borderColor: '#6C63FF' } }}>
                  Join Free
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Trust Badges */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[
            { icon: <LocalShipping />, title: 'Free Shipping', desc: 'On orders above ₹500' },
            { icon: <Security />, title: 'Secure Payments', desc: 'UPI, Cards & More' },
            { icon: <Headset />, title: '24/7 Support', desc: 'Always here to help' },
            { icon: <Payments />, title: 'Easy Returns', desc: '7-day return policy' },
          ].map((item, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 2, p: 2,
                borderRadius: 3, border: '1px solid', borderColor: 'divider',
                transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' },
              }}>
                <Box sx={{
                  p: 1.5, borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(255,101,132,0.1))',
                  color: 'primary.main',
                }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>{item.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Categories */}
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Shop by Category</Typography>
            <Typography variant="body1" color="text.secondary">Browse our wide range of collections</Typography>
          </Box>
          <Button component={Link} to="/products" endIcon={<ArrowForward />}>View All</Button>
        </Box>
        <Grid container spacing={3}>
          {(categories.length > 0 ? categories : Array.from({ length: 6 })).slice(0, 6).map((cat, i) => (
            <Grid item xs={6} sm={4} md={2} key={cat?.id || i}>
              <Card component={Link} to={cat ? `/products?category=${cat.id}` : '#'}
                sx={{ textDecoration: 'none', textAlign: 'center', p: 3, cursor: 'pointer' }}>
                <Box sx={{
                  width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 2,
                  background: `linear-gradient(135deg, hsl(${(i * 60) % 360}, 70%, 92%), hsl(${(i * 60 + 30) % 360}, 70%, 85%))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                }}>
                  {['🛒', '👕', '💍', '📱', '🏠', '🎁'][i % 6]}
                </Box>
                <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                  {cat?.name || <Skeleton width={80} />}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Products */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Featured Products</Typography>
              <Typography variant="body1" color="text.secondary">Hand-picked products just for you</Typography>
            </Box>
            <Button component={Link} to="/products" endIcon={<ArrowForward />}>View All</Button>
          </Box>
          <Grid container spacing={3}>
            {(loading ? Array.from({ length: 8 }) : featuredProducts).map((product, i) => (
              <Grid item xs={6} sm={4} md={3} key={product?.id || i}>
                {loading ? (
                  <Card><Skeleton variant="rectangular" height={200} /><CardContent><Skeleton /><Skeleton width="60%" /></CardContent></Card>
                ) : (
                  <Card component={Link} to={`/products/${product.slug}`} sx={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ position: 'relative', pt: '100%', bgcolor: 'grey.100' }}>
                      {product.images?.[0]?.imageUrl && (
                        <CardMedia component="img" image={product.images[0].imageUrl}
                          alt={product.name} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      {product.discountPercentage > 0 && (
                        <Chip label={`${Math.round(product.discountPercentage)}% OFF`} size="small"
                          sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'error.main', color: 'white', fontWeight: 700 }} />
                      )}
                    </Box>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" color="text.secondary" noWrap>{product.categoryName}</Typography>
                      <Typography variant="subtitle1" fontWeight={600} sx={{
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {product.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, my: 0.5 }}>
                        <Rating value={Number(product.averageRating) || 0} precision={0.5} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">({product.reviewCount})</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 'auto' }}>
                        <Typography variant="h6" fontWeight={800} color="primary.main">₹{product.price}</Typography>
                        {product.compareAtPrice && (
                          <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                            ₹{product.compareAtPrice}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
