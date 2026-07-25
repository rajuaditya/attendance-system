const Card = ({ title, subtitle, actions, children, className = '' }) => (
  <div className={`card p-5 ${className}`}>
    {(title || actions) && (
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          {title && <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

export default Card;
