import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceApi } from '../../api/attendance.api';
import { useFetch } from '../../hooks/useFetch.js';
import Card from '../../components/common/Card.jsx';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { Input, Button } from '../../components/common/FormControls.jsx';
import { formatDate, formatTime } from '../../utils/format.js';

const MyAttendance = () => {
  const [tab, setTab] = useState('history');
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const historyFetcher = useCallback(() => attendanceApi.myHistory({ limit: 60 }).then((r) => r.data.data), []);
  const { data: historyData, loading: historyLoading } = useFetch(historyFetcher, [historyFetcher]);

  const leavesFetcher = useCallback(() => attendanceApi.listLeaves().then((r) => r.data.data), []);
  const { data: leavesData, loading: leavesLoading, refetch: refetchLeaves } = useFetch(leavesFetcher, [leavesFetcher]);

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      setFormError('End date cannot be before start date');
      return;
    }
    setSaving(true);
    try {
      await attendanceApi.requestLeave(leaveForm);
      toast.success('Leave request submitted');
      setLeaveModalOpen(false);
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      refetchLeaves();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSaving(false);
    }
  };

  const historyColumns = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.attendance_date) },
    { key: 'checkIn', header: 'Check In', render: (row) => formatTime(row.check_in_time) },
    { key: 'checkOut', header: 'Check Out', render: (row) => formatTime(row.check_out_time) },
    { key: 'hours', header: 'Hours', render: (row) => row.working_hours ?? '-' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const leaveColumns = [
    { key: 'range', header: 'Dates', render: (row) => `${formatDate(row.start_date)} - ${formatDate(row.end_date)}` },
    { key: 'reason', header: 'Reason', render: (row) => row.reason || '-' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">My Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your attendance history and leave requests</p>
        </div>
        <Button onClick={() => setLeaveModalOpen(true)}>
          <Plus size={16} /> Request Leave
        </Button>
      </div>

      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800">
        {['history', 'leaves'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'history' ? 'Attendance History' : 'Leave Requests'}
          </button>
        ))}
      </div>

      <Card>
        {tab === 'history' ? (
          <Table columns={historyColumns} rows={historyData?.records} loading={historyLoading} emptyMessage="No attendance records yet" />
        ) : (
          <Table columns={leaveColumns} rows={leavesData?.leaves} loading={leavesLoading} emptyMessage="No leave requests yet" />
        )}
      </Card>

      <Modal open={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Request Leave" size="sm">
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          {formError && <div className="rounded-lg bg-status-absent/10 px-3 py-2 text-sm text-status-absent">{formError}</div>}
          <Input label="Start date" type="date" required value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
          <Input label="End date" type="date" required value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
          <Input label="Reason (optional)" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setLeaveModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyAttendance;
