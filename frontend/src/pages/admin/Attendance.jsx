import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceApi } from '../../api/attendance.api';
import { metaApi, employeeApi } from '../../api/employee.api';
import { useFetch } from '../../hooks/useFetch.js';
import Card from '../../components/common/Card.jsx';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { Input, Select, Button } from '../../components/common/FormControls.jsx';
import { formatDate, formatTime, todayISO } from '../../utils/format.js';

const emptyManual = {
  userId: '',
  attendanceDate: todayISO(),
  status: 'present',
  checkInTime: '',
  checkOutTime: '',
  remarks: '',
};

const Attendance = () => {
  const [date, setDate] = useState(todayISO());
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState(emptyManual);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [leaves, setLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(true);

  useEffect(() => {
    metaApi.departments().then((r) => setDepartments(r.data.data.departments)).catch(() => {});
  }, []);

  const fetcher = useCallback(
    () => attendanceApi.all({ date, departmentId, status, page, limit: 20 }).then((r) => r.data.data),
    [date, departmentId, status, page]
  );
  const { data, loading, refetch } = useFetch(fetcher, [fetcher]);

  const loadLeaves = useCallback(async () => {
    setLeavesLoading(true);
    try {
      const { data: res } = await attendanceApi.listLeaves({ status: 'pending' });
      setLeaves(res.data.leaves);
    } finally {
      setLeavesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const openManualModal = () => {
    setManualForm({ ...emptyManual, attendanceDate: date });
    setFormError('');
    employeeApi.list({ limit: 100 }).then((r) => setEmployees(r.data.data.employees));
    setManualOpen(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await attendanceApi.manualMark({
        ...manualForm,
        checkInTime: manualForm.checkInTime ? `${manualForm.attendanceDate}T${manualForm.checkInTime}` : undefined,
        checkOutTime: manualForm.checkOutTime ? `${manualForm.attendanceDate}T${manualForm.checkOutTime}` : undefined,
      });
      toast.success('Attendance record saved');
      setManualOpen(false);
      refetch();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save attendance record');
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveDecision = async (leave, decision) => {
    try {
      await attendanceApi.decideLeave(leave.id, decision);
      toast.success(`Leave ${decision}`);
      loadLeaves();
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    }
  };

  const columns = [
    { key: 'employee_code', header: 'ID', render: (row) => row.User?.employee_code },
    { key: 'name', header: 'Name', render: (row) => row.User?.full_name },
    { key: 'department', header: 'Department', render: (row) => row.User?.Department?.name || '-' },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.attendance_date) },
    { key: 'checkIn', header: 'Check In', render: (row) => formatTime(row.check_in_time) },
    { key: 'checkOut', header: 'Check Out', render: (row) => formatTime(row.check_out_time) },
    { key: 'hours', header: 'Hours', render: (row) => row.working_hours ?? '-' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const leaveColumns = [
    { key: 'name', header: 'Employee', render: (row) => row.User?.full_name },
    { key: 'range', header: 'Dates', render: (row) => `${formatDate(row.start_date)} - ${formatDate(row.end_date)}` },
    { key: 'reason', header: 'Reason', render: (row) => row.reason || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleLeaveDecision(row, 'approved')} className="!px-2.5 !py-1 text-xs">
            Approve
          </Button>
          <Button variant="danger" onClick={() => handleLeaveDecision(row, 'rejected')} className="!px-2.5 !py-1 text-xs">
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review daily attendance and manage corrections</p>
        </div>
        <Button onClick={openManualModal}>
          <Plus size={16} /> Manual Entry
        </Button>
      </div>

      {leaves.length > 0 && (
        <Card title="Pending Leave Requests" subtitle={`${leaves.length} awaiting your decision`}>
          <Table columns={leaveColumns} rows={leaves} loading={leavesLoading} emptyMessage="No pending leave requests" />
        </Card>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-slate-400" />
            <Input type="date" value={date} onChange={(e) => { setPage(1); setDate(e.target.value); }} className="w-40" />
          </div>
          <Select value={departmentId} onChange={(e) => { setPage(1); setDepartmentId(e.target.value); }} className="w-44">
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="w-40">
            <option value="">All statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
            <option value="holiday">Holiday</option>
          </Select>
        </div>

        <Table columns={columns} rows={data?.records} loading={loading} emptyMessage="No attendance records for this filter" />

        {data?.pagination && data.pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Page {data.pagination.page} of {data.pagination.pages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="secondary" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={manualOpen} onClose={() => setManualOpen(false)} title="Manual Attendance Entry" size="md">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {formError && <div className="rounded-lg bg-status-absent/10 px-3 py-2 text-sm text-status-absent">{formError}</div>}
          <Select label="Employee" required value={manualForm.userId} onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}>
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" required value={manualForm.attendanceDate} onChange={(e) => setManualForm({ ...manualForm, attendanceDate: e.target.value })} />
            <Select label="Status" value={manualForm.status} onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
            </Select>
            <Input label="Check-in time" type="time" value={manualForm.checkInTime} onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })} />
            <Input label="Check-out time" type="time" value={manualForm.checkOutTime} onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })} />
          </div>
          <Input label="Remarks" value={manualForm.remarks} onChange={(e) => setManualForm({ ...manualForm, remarks: e.target.value })} placeholder="Optional note" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Attendance;
