import { useCallback } from 'react';
import { Clock, CalendarCheck, Timer, Umbrella } from 'lucide-react';
import { dashboardApi } from '../../api/attendance.api';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../hooks/useAuth.js';
import StatCard from '../../components/common/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import Loader from '../../components/common/Loader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { formatTime } from '../../utils/format.js';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const fetcher = useCallback(() => dashboardApi.employee().then((r) => r.data.data), []);
  const { data, loading, error } = useFetch(fetcher, []);

  if (loading) return <Loader full label="Loading your dashboard…" />;
  if (error) return <p className="text-status-absent">{error}</p>;

  const today = data.today;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
          Welcome back, {user.fullName.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Here's your attendance summary for this month</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Present Days (MTD)" value={data.monthToDate.presentDays} icon={CalendarCheck} tone="present" />
        <StatCard label="Late Days" value={data.monthToDate.lateDays} icon={Clock} tone="late" />
        <StatCard label="Working Hours" value={data.monthToDate.totalWorkingHours} suffix="hrs" icon={Timer} tone="brand" />
        <StatCard label="Leave Balance" value={data.leaveBalance} suffix="days" icon={Umbrella} tone="leave" />
      </div>

      <Card title="Today's Attendance">
        {!today ? (
          <p className="text-sm text-slate-400">You haven't checked in today yet. Scan your QR code to check in.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="label">Status</p>
              <StatusBadge status={today.status} />
            </div>
            <div>
              <p className="label">Check In</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatTime(today.check_in_time)}</p>
            </div>
            <div>
              <p className="label">Check Out</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatTime(today.check_out_time)}</p>
            </div>
            <div>
              <p className="label">Working Hours</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{today.working_hours ?? '-'}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
