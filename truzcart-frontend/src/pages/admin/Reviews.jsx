import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Chip, Rating, CircularProgress, TablePagination, Alert
} from '@mui/material';
import { CheckCircle, Cancel, RateReview } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api';

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchReviews(); }, [page, size]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingReviews(page, size);
      const data = res.data?.data;
      setReviews(data?.content || []);
      setTotal(data?.totalElements || 0);
    } catch (err) { toast.error('Failed to load reviews'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveReview(id);
      setReviews(reviews.filter(r => r.id !== id));
      setTotal(t => t - 1);
      toast.success('Review approved');
    } catch (err) { toast.error('Failed to approve review'); }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject and delete this review?')) return;
    try {
      await adminService.rejectReview(id);
      setReviews(reviews.filter(r => r.id !== id));
      setTotal(t => t - 1);
      toast.success('Review rejected');
    } catch (err) { toast.error('Failed to reject review'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Review Moderation</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} review{total !== 1 ? 's' : ''} pending approval
          </Typography>
        </Box>
      </Box>

      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
        ) : reviews.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <RateReview sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No pending reviews</Typography>
            <Typography variant="body2" color="text.secondary">All reviews have been moderated</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell sx={{ minWidth: 300 }}>Review</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviews.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Typography fontWeight={600} variant="body2">{r.productName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{r.userName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Rating value={r.rating} size="small" readOnly />
                          <Typography variant="body2" fontWeight={600}>{r.rating}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {r.title && <Typography variant="subtitle2" fontWeight={600}>{r.title}</Typography>}
                        <Typography variant="body2" color="text.secondary"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {r.comment || '(no comment)'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {r.isVerifiedPurchase
                          ? <Chip label="Verified" size="small" color="success" variant="outlined" />
                          : <Chip label="Unverified" size="small" variant="outlined" />}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{new Date(r.createdAt).toLocaleDateString()}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" color="success" startIcon={<CheckCircle />}
                          onClick={() => handleApprove(r.id)} sx={{ mr: 1 }}>
                          Approve
                        </Button>
                        <Button size="small" color="error" startIcon={<Cancel />}
                          onClick={() => handleReject(r.id)}>
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
              rowsPerPage={size} onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value)); setPage(0); }} />
          </>
        )}
      </Card>
    </Box>
  );
}

export default Reviews;
