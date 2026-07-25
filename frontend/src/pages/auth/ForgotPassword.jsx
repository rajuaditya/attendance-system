import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { Input, Button } from '../../components/common/FormControls.jsx';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword(email);
      setSubmitted(true);
      if (data?.data?.devResetToken) setDevToken(data.data.devResetToken);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light px-4 dark:bg-surface-dark">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <KeyRound size={22} />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enter your account email and we'll send you a reset link.
          </p>
        </div>

        <div className="card p-6">
          {submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              </p>
              {devToken && (
                <div className="rounded-lg bg-amber-500/10 p-3 text-left text-xs text-amber-700 dark:text-amber-400">
                  <p className="mb-1 font-semibold">Development mode — no email provider configured:</p>
                  <Link to={`/reset-password?token=${devToken}`} className="break-all underline">
                    Click here to reset your password
                  </Link>
                </div>
              )}
              <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                <ArrowLeft size={15} /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-lg bg-status-absent/10 px-3 py-2 text-sm text-status-absent">{error}</div>}
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
              <Button type="submit" className="w-full" loading={loading}>
                Send reset link
              </Button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
                <ArrowLeft size={15} /> Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
