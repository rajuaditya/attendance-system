const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-[3px]' };

const Loader = ({ size = 'md', full = false, label = 'Loading…' }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <div
        className={`${SIZES[size]} rounded-full border-brand-200 border-t-brand-600 animate-spin`}
        aria-hidden="true"
      />
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );

  if (full) {
    return <div className="flex min-h-[50vh] w-full items-center justify-center">{spinner}</div>;
  }
  return spinner;
};

export default Loader;
