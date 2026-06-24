import api from '../api/axiosConfig';

export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
};

export const productService = {
  getAll: (page = 0, size = 12, sortBy = 'createdAt', sortDir = 'desc') =>
    api.get(`/api/products?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
  getById: (id) => api.get(`/api/products/${id}`),
  getBySlug: (slug) => api.get(`/api/products/slug/${slug}`),
  search: (query, page = 0, size = 12) =>
    api.get(`/api/products/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`),
  getByCategory: (categoryId, page = 0, size = 12) =>
    api.get(`/api/products/category/${categoryId}?page=${page}&size=${size}`),
  getFeatured: (page = 0, size = 12) =>
    api.get(`/api/products/featured?page=${page}&size=${size}`),
};

export const categoryService = {
  getAll: () => api.get('/api/categories'),
  getFlat: () => api.get('/api/categories/flat'),
  getById: (id) => api.get(`/api/categories/${id}`),
};

export const cartService = {
  getCart: () => api.get('/api/cart'),
  addItem: (productId, quantity) => api.post('/api/cart/items', { productId, quantity }),
  updateQuantity: (itemId, quantity) => api.put(`/api/cart/items/${itemId}?quantity=${quantity}`),
  removeItem: (itemId) => api.delete(`/api/cart/items/${itemId}`),
  clearCart: () => api.delete('/api/cart/clear'),
};

export const orderService = {
  create: (data) => api.post('/api/orders', data),
  getMyOrders: (page = 0, size = 10) => api.get(`/api/orders?page=${page}&size=${size}`),
  getById: (id) => api.get(`/api/orders/${id}`),
  cancel: (id) => api.put(`/api/orders/cancel/${id}`),
};

export const paymentService = {
  create: (orderId) => api.post('/api/payments/create', { orderId }),
  verify: (data) => api.post('/api/payments/verify', data),
};

export const adminService = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  // Products
  createProduct: (data) => api.post('/api/admin/products', data),
  updateProduct: (id, data) => api.put(`/api/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/admin/products/${id}`),
  updateStock: (id, quantity, reason) =>
    api.patch(`/api/admin/products/${id}/stock?quantity=${quantity}&reason=${encodeURIComponent(reason)}`),
  toggleProductStatus: (id) => api.patch(`/api/admin/products/${id}/status`),
  // Categories
  createCategory: (data) => api.post('/api/admin/categories', data),
  updateCategory: (id, data) => api.put(`/api/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/admin/categories/${id}`),
  // Orders
  getAllOrders: (page = 0, size = 20, status = '') =>
    api.get(`/api/admin/orders?page=${page}&size=${size}${status ? `&status=${status}` : ''}`),
  getOrderById: (id) => api.get(`/api/admin/orders/${id}`),
  updateOrderStatus: (id, status, notes = '') =>
    api.put(`/api/admin/orders/${id}/status?status=${status}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`),
  // Coupons
  getCoupons: (page = 0, size = 20) => api.get(`/api/admin/coupons?page=${page}&size=${size}`),
  getCouponById: (id) => api.get(`/api/admin/coupons/${id}`),
  createCoupon: (data) => api.post('/api/admin/coupons', data),
  updateCoupon: (id, data) => api.put(`/api/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/api/admin/coupons/${id}`),
  // Reviews
  getPendingReviews: (page = 0, size = 20) => api.get(`/api/admin/reviews/pending?page=${page}&size=${size}`),
  approveReview: (id) => api.put(`/api/admin/reviews/${id}/approve`),
  rejectReview: (id) => api.delete(`/api/admin/reviews/${id}`),
  // Users
  getUsers: (page = 0, size = 20, search = '') =>
    api.get(`/api/admin/users?page=${page}&size=${size}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  toggleUserStatus: (id) => api.put(`/api/admin/users/${id}/status`),
};

export const userService = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data) => api.put('/api/user/profile', data),
  changePassword: (data) => api.put('/api/user/change-password', data),
  getAddresses: () => api.get('/api/user/addresses'),
  addAddress: (data) => api.post('/api/user/addresses', data),
  updateAddress: (id, data) => api.put(`/api/user/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/api/user/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/api/user/addresses/${id}/default`),
};

export const wishlistService = {
  getWishlist: (page = 0, size = 20) => api.get(`/api/wishlist?page=${page}&size=${size}`),
  add: (productId) => api.post(`/api/wishlist/${productId}`),
  remove: (productId) => api.delete(`/api/wishlist/${productId}`),
  check: (productId) => api.get(`/api/wishlist/${productId}/check`),
};

export const reviewService = {
  getProductReviews: (productId, page = 0, size = 10) =>
    api.get(`/api/reviews/product/${productId}?page=${page}&size=${size}`),
  addReview: (data) => api.post('/api/reviews', data),
  updateReview: (id, data) => api.put(`/api/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/api/reviews/${id}`),
};

export const couponService = {
  validate: (code, orderTotal) =>
    api.post(`/api/coupons/validate?code=${encodeURIComponent(code)}&orderTotal=${orderTotal}`),
};

