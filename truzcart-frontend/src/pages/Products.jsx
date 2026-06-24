import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardMedia, CardContent, Chip, Rating,
  TextField, MenuItem, Pagination, Skeleton, InputAdornment, Breadcrumbs
} from '@mui/material';
import { Search, FilterList, NavigateNext } from '@mui/icons-material';
import { productService, categoryService } from '../services/api';

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  const page = parseInt(searchParams.get('page') || '0');
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDir = searchParams.get('sortDir') || 'desc';

  useEffect(() => {
    categoryService.getFlat().then(res => setCategories(res.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let res;
        if (query) {
          res = await productService.search(query, page, 12);
        } else if (categoryId) {
          res = await productService.getByCategory(categoryId, page, 12);
        } else {
          res = await productService.getAll(page, 12, sortBy, sortDir);
        }
        setProducts(res.data?.data?.content || []);
        setTotalPages(res.data?.data?.totalPages || 0);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, query, categoryId, sortBy, sortDir]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '0');
    setSearchParams(params);
  };

  return (
    <Box sx={{ bgcolor: '#F8F9FE', minHeight: '80vh', py: 4 }}>
      <Container maxWidth="xl">
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
          <Typography component={Link} to="/" color="inherit" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
            Home
          </Typography>
          <Typography color="text.primary" fontWeight={600}>Products</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={800} gutterBottom>
          {query ? `Results for "${query}"` : categoryId ? 'Category Products' : 'All Products'}
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search products..."
            size="small"
            defaultValue={query}
            onKeyDown={(e) => { if (e.key === 'Enter') updateParam('q', e.target.value); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 250, bgcolor: 'white', borderRadius: 2 }}
          />
          <TextField
            select size="small" label="Category" value={categoryId}
            onChange={(e) => updateParam('category', e.target.value)}
            sx={{ minWidth: 160, bgcolor: 'white' }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select size="small" label="Sort By" value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split('-');
              const params = new URLSearchParams(searchParams);
              params.set('sortBy', sb);
              params.set('sortDir', sd);
              params.set('page', '0');
              setSearchParams(params);
            }}
            sx={{ minWidth: 180, bgcolor: 'white' }}
          >
            <MenuItem value="createdAt-desc">Newest First</MenuItem>
            <MenuItem value="price-asc">Price: Low to High</MenuItem>
            <MenuItem value="price-desc">Price: High to Low</MenuItem>
            <MenuItem value="name-asc">Name: A-Z</MenuItem>
          </TextField>
        </Box>

        {/* Product Grid */}
        <Grid container spacing={3}>
          {(loading ? Array.from({ length: 12 }) : products).map((product, i) => (
            <Grid item xs={6} sm={4} md={3} key={product?.id || i}>
              {loading ? (
                <Card><Skeleton variant="rectangular" height={200} /><CardContent><Skeleton /><Skeleton width="60%" /></CardContent></Card>
              ) : (
                <Card component={Link} to={`/products/${product.slug}`}
                  sx={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ position: 'relative', pt: '100%', bgcolor: 'grey.100', overflow: 'hidden' }}>
                    {product.images?.[0]?.imageUrl ? (
                      <CardMedia component="img" image={product.images[0].imageUrl} alt={product.name}
                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                          transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }} />
                    ) : (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'grey.300' }}>
                        📦
                      </Box>
                    )}
                    {product.discountPercentage > 0 && (
                      <Chip label={`${Math.round(product.discountPercentage)}% OFF`} size="small"
                        sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'error.main', color: 'white', fontWeight: 700 }} />
                    )}
                    {!product.inStock && (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Chip label="Out of Stock" sx={{ bgcolor: 'white', fontWeight: 700 }} />
                      </Box>
                    )}
                  </Box>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="caption" color="text.secondary">{product.categoryName || product.brand}</Typography>
                    <Typography variant="subtitle1" fontWeight={600} sx={{
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 48,
                    }}>
                      {product.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, my: 0.5 }}>
                      <Rating value={Number(product.averageRating) || 0} precision={0.5} size="small" readOnly />
                      <Typography variant="caption" color="text.secondary">({product.reviewCount || 0})</Typography>
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

        {products.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>🔍</Typography>
            <Typography variant="h5" fontWeight={700} gutterBottom>No products found</Typography>
            <Typography color="text.secondary">Try adjusting your search or filters</Typography>
          </Box>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Pagination count={totalPages} page={page + 1} onChange={(_, v) => updateParam('page', String(v - 1))}
              color="primary" size="large" shape="rounded" />
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default Products;
