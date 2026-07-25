import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import { employeeApi } from '../../api/employee.api';
import { authApi } from '../../api/auth.api';
import Card from '../../components/common/Card.jsx';
import { Input, Button } from '../../components/common/FormControls.jsx';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const Profile = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const { data } = await employeeApi.uploadPhoto(user.id, formData);
      setUser({ ...user, profilePhotoUrl: data.data.profilePhotoUrl });
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (!PASSWORD_RULE.test(pwForm.newPassword)) {
      setPwError('Password must be 8+ characters with upper, lower, number, and special character');
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">View your details and manage account security</p>
      </div>

      <Card>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              {user.profilePhotoUrl ? (
                <img src={user.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                user.fullName?.[0]?.toUpperCase()
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 rounded-full bg-brand-600 p-1.5 text-white shadow-md hover:bg-brand-700"
              aria-label="Change profile photo"
            >
              <Camera size={13} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{user.fullName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            <p className="mt-1 text-xs font-semibold text-brand-600">{user.employeeCode}</p>
          </div>
        </div>
      </Card>

      <Card title="Change Password">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {pwError && <div className="rounded-lg bg-status-absent/10 px-3 py-2 text-sm text-status-absent">{pwError}</div>}
          <Input
            label="Current password"
            type="password"
            required
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          />
          <Input
            label="New password"
            type="password"
            required
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
          />
          <p className="text-xs text-slate-400">Min 8 characters, with uppercase, lowercase, number & special character.</p>
          <Button type="submit" loading={pwSaving}>Update password</Button>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
