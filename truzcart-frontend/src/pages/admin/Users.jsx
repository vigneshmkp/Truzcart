import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Avatar, Chip, IconButton, TextField, InputAdornment,
  CircularProgress, TablePagination, Switch, Tooltip
} from '@mui/material';
import { Search, Block, CheckCircle } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { fetchUsers(); }, [page, size, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(page, size, search);
      const data = res.data?.data;
      setUsers(data?.content || []);
      setTotal(data?.totalElements || 0);
    } catch (err) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await adminService.toggleUserStatus(userId);
      const updated = res.data?.data;
      setUsers(users.map(u => u.id === userId ? { ...u, enabled: updated.enabled } : u));
      toast.success(updated.enabled ? 'User enabled' : 'User disabled');
    } catch (err) { toast.error('Failed to update user status'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Users</Typography>
          <Typography variant="body2" color="text.secondary">Manage customer accounts</Typography>
        </Box>
        <Box component="form" onSubmit={handleSearch} sx={{
          display: 'flex', bgcolor: 'grey.100', borderRadius: 2, px: 2, py: 0.5, minWidth: 300,
        }}>
          <TextField variant="standard" placeholder="Search by name or email..." fullWidth
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              disableUnderline: true,
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
            }} />
        </Box>
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
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} hover sx={{ opacity: u.enabled ? 1 : 0.6 }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{
                            width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700,
                            background: u.enabled
                              ? 'linear-gradient(135deg, #6C63FF, #FF6584)'
                              : 'grey.400',
                          }}>
                            {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                          </Avatar>
                          <Typography fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phone || '—'}</TableCell>
                      <TableCell>
                        {u.roles?.map((r) => (
                          <Chip key={r} label={r.replace('ROLE_', '')} size="small"
                            color={r === 'ROLE_ADMIN' ? 'secondary' : 'default'}
                            sx={{ mr: 0.5, fontSize: '0.7rem' }} />
                        ))}
                      </TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {u.emailVerified
                          ? <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                          : <Chip label="Unverified" size="small" variant="outlined" />}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={u.enabled ? 'Disable user' : 'Enable user'}>
                          <Switch checked={u.enabled} onChange={() => handleToggleStatus(u.id)}
                            color="primary" size="small"
                            disabled={u.roles?.includes('ROLE_ADMIN')} />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No users found</TableCell></TableRow>
                  )}
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

export default Users;
