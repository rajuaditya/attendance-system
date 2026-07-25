import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-light px-4 text-center dark:bg-surface-dark">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-status-absent/10 text-status-absent">
      <ShieldAlert size={26} />
    </div>
    <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Access denied</h1>
    <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
      You don't have permission to view this page. If you believe this is a mistake, contact your administrator.
    </p>
    <Link to="/" className="btn-primary">
      Go home
    </Link>
  </div>
);

export default Unauthorized;
