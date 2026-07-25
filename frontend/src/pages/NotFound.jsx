import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-light px-4 text-center dark:bg-surface-dark">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
      <Compass size={26} />
    </div>
    <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Page not found</h1>
    <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
      The page you're looking for doesn't exist or may have been moved.
    </p>
    <Link to="/" className="btn-primary">
      Go home
    </Link>
  </div>
);

export default NotFound;
