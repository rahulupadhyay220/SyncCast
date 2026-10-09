import React from 'react';

export function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-white/[0.06] text-zinc-300 border-white/[0.08]',
    blood: 'bg-[#e50914]/10 text-red-300 border-[#e50914]/30',
    rose: 'bg-[#e50914]/10 text-red-300 border-[#e50914]/30',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    blue: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase border ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
