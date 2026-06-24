import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, Button, Grid, Card, CardContent,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Alert, CircularProgress, Tabs, Tab
} from '@mui/material';
import {
  Edit, Delete, Star, Home, LocationOn, Add, Check
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { userService } from '../../services/api';

function Profile() {
  const [tabIndex, setTabIndex] = useState(0);
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // Address dialog
  const [addressDialog, setAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'India', isDefault: false,
  });

  useEffect(() => { fetchProfile(); fetchAddresses(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await userService.getProfile();
      const p = res.data?.data;
      setProfile(p);
      setProfileForm({ firstName: p.firstName, lastName: p.lastName, phone: p.phone || '' });
    } catch (err) { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const fetchAddresses = async () => {
    try {
      const res = await userService.getAddresses();
      setAddresses(res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateProfile(profileForm);
      toast.success('Profile updated');
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setChangingPassword(true);
    try {
      await userService.changePassword(passwordForm);
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setChangingPassword(false); }
  };

  const openAddressDialog = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({ ...address });
    } else {
      setEditingAddress(null);
      setAddressForm({ label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'India', isDefault: false });
    }
    setAddressDialog(true);
  };

  const handleSaveAddress = async () => {
    try {
      if (editingAddress) {
        await userService.updateAddress(editingAddress.id, addressForm);
        toast.success('Address updated');
      } else {
        await userService.addAddress(addressForm);
        toast.success('Address added');
      }
      setAddressDialog(false);
      fetchAddresses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save address'); }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      await userService.deleteAddress(id);
      toast.success('Address deleted');
      fetchAddresses();
    } catch (err) { toast.error('Failed to delete address'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await userService.setDefaultAddress(id);
      toast.success('Default address updated');
      fetchAddresses();
    } catch (err) { toast.error('Failed to update default'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>My Account</Typography>

      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Profile" />
        <Tab label="Addresses" />
        <Tab label="Security" />
      </Tabs>

      {/* Profile Tab */}
      {tabIndex === 0 && (
        <Card sx={{ maxWidth: 600 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Personal Information</Typography>
            <Box component="form" onSubmit={handleUpdateProfile}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="First Name" value={profileForm.firstName}
                    onChange={(e) => setProfileForm(f => ({ ...f, firstName: e.target.value }))} required />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Last Name" value={profileForm.lastName}
                    onChange={(e) => setProfileForm(f => ({ ...f, lastName: e.target.value }))} required />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Email" value={profile?.email || ''} disabled
                    helperText="Email cannot be changed" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Phone" value={profileForm.phone}
                    onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" disabled={saving} sx={{ px: 4 }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Addresses Tab */}
      {tabIndex === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>Saved Addresses</Typography>
            <Button startIcon={<Add />} variant="contained" onClick={() => openAddressDialog()}>Add Address</Button>
          </Box>
          <Grid container spacing={3}>
            {addresses.map((addr) => (
              <Grid item xs={12} md={6} key={addr.id}>
                <Card sx={{ position: 'relative', border: addr.isDefault ? '2px solid' : '1px solid',
                  borderColor: addr.isDefault ? 'primary.main' : 'divider' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={addr.label} size="small" color={addr.isDefault ? 'primary' : 'default'} />
                        {addr.isDefault && <Chip label="Default" size="small" variant="outlined" color="primary" icon={<Star sx={{ fontSize: 16 }} />} />}
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => openAddressDialog(addr)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteAddress(addr.id)}><Delete fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Typography fontWeight={600}>{addr.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">{addr.phone}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{addr.country}</Typography>
                    {!addr.isDefault && (
                      <Button size="small" sx={{ mt: 1 }} startIcon={<Check />} onClick={() => handleSetDefault(addr.id)}>
                        Set as Default
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {addresses.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">No addresses saved yet. Add your first address.</Alert>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Security Tab */}
      {tabIndex === 2 && (
        <Card sx={{ maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Change Password</Typography>
            <Box component="form" onSubmit={handleChangePassword}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Current Password" type="password" value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} required />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="New Password" type="password" value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} required
                    helperText="Minimum 8 characters" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Confirm New Password" type="password" value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" disabled={changingPassword} sx={{ px: 4 }}>
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Address Dialog */}
      <Dialog open={addressDialog} onClose={() => setAddressDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Label" value={addressForm.label}
                onChange={(e) => setAddressForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Home, Work, etc." />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Full Name" value={addressForm.fullName}
                onChange={(e) => setAddressForm(f => ({ ...f, fullName: e.target.value }))} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Phone" value={addressForm.phone}
                onChange={(e) => setAddressForm(f => ({ ...f, phone: e.target.value }))} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Street Address" multiline rows={2} value={addressForm.street}
                onChange={(e) => setAddressForm(f => ({ ...f, street: e.target.value }))} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="City" value={addressForm.city}
                onChange={(e) => setAddressForm(f => ({ ...f, city: e.target.value }))} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="State" value={addressForm.state}
                onChange={(e) => setAddressForm(f => ({ ...f, state: e.target.value }))} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Zip Code" value={addressForm.zipCode}
                onChange={(e) => setAddressForm(f => ({ ...f, zipCode: e.target.value }))} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Country" value={addressForm.country}
                onChange={(e) => setAddressForm(f => ({ ...f, country: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddressDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAddress}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Profile;
