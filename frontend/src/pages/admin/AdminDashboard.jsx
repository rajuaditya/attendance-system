import { useCallback } from 'react';
import { Users, UserCheck, UserX, Clock, CalendarClock, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { dashboardApi } from '../../api/attendance.api';
import { useFetch } from '../../hooks/useFetch.js';
import StatCard from '../../components/common/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import Loader from '../../components/common/Loader.jsx';
import { formatDate } from '../../utils/format.js';

const COLORS = {
  present: '#0d9488',
  late: '#d97706',
  halfDay: '#7c3aed',
  absent: '#dc2626',
  onLeave: '#2563eb',
};

const AdminDashboard = () => {
  const fetcher = useCallback(() => dashboardApi.admin().then((r) => r.data.data), []);
  const { data, loading, error } = useFetch(fetcher, []);

  if (loading) return <Loader full label="Loading dashboard…" />;
  if (error) return <p className="text-status-absent">{error}</p>;

  const pieData = [
    { name: 'Present', value: data.present, color: COLORS.present },
    { name: 'Late', value: data.late, color: COLORS.late },
    { name: 'Half Day', value: data.halfDay, color: COLORS.halfDay },
    { name: 'Absent', value: data.absent, color: COLORS.absent },
    { name: 'On Leave', value: data.onLeave, color: COLORS.onLeave },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Overview for {formatDate(data.date)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Employees" value={data.totalEmployees} icon={Users} tone="brand" />
        <StatCard label="Present Today" value={data.present} icon={UserCheck} tone="present" />
        <StatCard label="Late" value={data.late} icon={Clock} tone="late" />
        <StatCard label="Half Day" value={data.halfDay} icon={Clock} tone="halfday" />
        <StatCard label="Absent" value={data.absent} icon={UserX} tone="absent" />
        <StatCard label="Pending Leaves" value={data.pendingLeaves} icon={CalendarClock} tone="leave" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Today's Attendance Breakdown" className="lg:col-span-2">
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No attendance recorded yet today.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Department Breakdown" actions={<PieIcon size={16} className="text-slate-400" />}>
          <ul className="space-y-3">
            {data.departmentBreakdown?.map((d) => (
              <li key={d.department_id || 'none'} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">{d.Department?.name || 'Unassigned'}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{d.dataValues?.count ?? d.count}</span>
              </li>
            ))}
            {(!data.departmentBreakdown || data.departmentBreakdown.length === 0) && (
              <p className="text-sm text-slate-400">No department data yet.</p>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
