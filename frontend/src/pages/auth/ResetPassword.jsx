import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { Input, Button } from '../../components/common/FormControls.jsx';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!PASSWORD_RULE.test(form.newPassword)) {
      setError('Password must be 8+ characters and include upper, lower, number, and special character.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, form.newPassword);
      toast.success('Password reset! Please log in with your new password.');
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light px-4 dark:bg-surface-dark">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <ShieldCheck size={22} />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Set a new password</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a strong password you haven't used before.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          {error && <div className="rounded-lg bg-status-absent/10 px-3 py-2 text-sm text-status-absent">{error}</div>}
          <Input
            label="New password"
            type="password"
            required
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            placeholder="••••••••"
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="••••••••"
          />
          <p className="text-xs text-slate-400">Min 8 characters, with uppercase, lowercase, number & special character.</p>
          <Button type="submit" className="w-full" loading={loading}>
            Reset password
          </Button>
          <Link to="/login" className="block text-center text-sm font-medium text-slate-500 hover:text-slate-700">
            Back to login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
