const STATUS_STYLES = {
  present: 'bg-status-present/10 text-status-present',
  late: 'bg-status-late/10 text-status-late',
  half_day: 'bg-status-halfday/10 text-status-halfday',
  absent: 'bg-status-absent/10 text-status-absent',
  leave: 'bg-status-leave/10 text-status-leave',
  holiday: 'bg-status-holiday/10 text-status-holiday',
  pending: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-status-present/10 text-status-present',
  rejected: 'bg-status-absent/10 text-status-absent',
  active: 'bg-status-present/10 text-status-present',
  inactive: 'bg-slate-400/10 text-slate-500',
};

const STATUS_LABELS = {
  present: 'Present',
  late: 'Late',
  half_day: 'Half Day',
  absent: 'Absent',
  leave: 'Leave',
  holiday: 'Holiday',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Active',
  inactive: 'Inactive',
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || 'bg-slate-200 text-slate-600';
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`badge ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

export default StatusBadge;
