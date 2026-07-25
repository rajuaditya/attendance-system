const StatCard = ({ label, value, icon: Icon, tone = 'brand', suffix }) => {
  const tones = {
    brand: 'bg-brand-500/10 text-brand-600',
    present: 'bg-status-present/10 text-status-present',
    late: 'bg-status-late/10 text-status-late',
    absent: 'bg-status-absent/10 text-status-absent',
    leave: 'bg-status-leave/10 text-status-leave',
    halfday: 'bg-status-halfday/10 text-status-halfday',
  };

  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold font-display text-slate-800 dark:text-slate-100">
          {value}
          {suffix && <span className="ml-1 text-sm font-medium text-slate-400">{suffix}</span>}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
