import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import { useAuth } from './hooks/useAuth.js';
import Loader from './components/common/Loader.jsx';

// Auth pages
import Login from './pages/auth/Login.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

// Admin pages (code-split — loaded only when an admin navigates to them)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const Employees = lazy(() => import('./pages/admin/Employees.jsx'));
const Attendance = lazy(() => import('./pages/admin/Attendance.jsx'));
const QrScanner = lazy(() => import('./pages/admin/QrScanner.jsx'));
const Reports = lazy(() => import('./pages/admin/Reports.jsx'));
const Departments = lazy(() => import('./pages/admin/Departments.jsx'));

// Employee pages (code-split)
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard.jsx'));
const MyAttendance = lazy(() => import('./pages/employee/MyAttendance.jsx'));
const MyQrCode = lazy(() => import('./pages/employee/MyQrCode.jsx'));
const Profile = lazy(() => import('./pages/employee/Profile.jsx'));

import NotFound from './pages/NotFound.jsx';
import Unauthorized from './pages/Unauthorized.jsx';

const RoleHome = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'employee' ? '/employee/dashboard' : '/admin/dashboard'} replace />;
};

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Suspense fallback={<Loader full label="Loading…" />}>
      <Routes>
        <Route path="/" element={<RoleHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Admin / Super Admin */}
        <Route element={<ProtectedRoute roles={['admin', 'super_admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<Employees />} />
            <Route path="/admin/attendance" element={<Attendance />} />
            <Route path="/admin/qr-scanner" element={<QrScanner />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/departments" element={<Departments />} />
          </Route>
        </Route>

        {/* Employee (also accessible to admins viewing their own profile) */}
        <Route element={<ProtectedRoute roles={['employee', 'admin', 'super_admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/attendance" element={<MyAttendance />} />
            <Route path="/employee/qr-code" element={<MyQrCode />} />
            <Route path="/employee/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
}

export default App;
