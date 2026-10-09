import React from 'react';

export function Input({
  className = '',
  type = 'text',
  icon: Icon,
  ...props
}) {
  if (Icon) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <input
          type={type}
          className={`w-full pl-9 pr-3 py-2 bg-zinc-900/60 border border-white/[0.08] rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:bg-zinc-900 transition-all ${className}`}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      type={type}
      className={`w-full px-3 py-2 bg-zinc-900/60 border border-white/[0.08] rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:bg-zinc-900 transition-all ${className}`}
      {...props}
    />
  );
}
