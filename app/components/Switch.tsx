interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
}

export function Switch({ checked, onChange, leftLabel, rightLabel, className = '' }: SwitchProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {leftLabel && (
        <span className={`text-sm font-mono ${!checked ? 'text-blue-400' : 'text-slate-400'}`}>{leftLabel}</span>
      )}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`${
          checked ? 'bg-blue-600' : 'bg-slate-700'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border border-slate-600`}
      >
        <span
          className={`${
            checked ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </button>
      {rightLabel && (
        <span className={`text-sm font-mono ${checked ? 'text-blue-400' : 'text-slate-400'}`}>{rightLabel}</span>
      )}
    </div>
  );
}
