import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  QrCode,
  FileBarChart,
  UserCircle,
  Building2,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/admin/qr-scanner', label: 'QR Scanner', icon: QrCode },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
];

const EMPLOYEE_LINKS = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/attendance', label: 'My Attendance', icon: CalendarCheck },
  { to: '/employee/qr-code', label: 'My QR Code', icon: QrCode },
  { to: '/employee/profile', label: 'Profile', icon: UserCircle },
];

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const links = user?.role === 'employee' ? EMPLOYEE_LINKS : ADMIN_LINKS;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform border-r border-slate-100 bg-white transition-transform dark:border-slate-800 dark:bg-surface-cardDark lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-display text-sm font-bold text-white">
              A
            </div>
            <span className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">AttendHQ</span>
          </div>
          <button className="lg:hidden text-slate-400" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
