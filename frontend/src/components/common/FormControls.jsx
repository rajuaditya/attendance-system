export const Input = ({ label, error, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <input className="input" {...props} />
    {error && <p className="mt-1 text-xs text-status-absent">{error}</p>}
  </div>
);

export const Select = ({ label, error, children, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <select className="input" {...props}>
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-status-absent">{error}</p>}
  </div>
);

export const Button = ({ variant = 'primary', className = '', children, loading, ...props }) => {
  const base = { primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger', ghost: 'btn-ghost' }[variant];
  return (
    <button className={`${base} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
      {children}
    </button>
  );
};
