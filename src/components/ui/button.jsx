import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-mono font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-white/20 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none';

  const variants = {
    primary: 'bg-[#e50914] text-white hover:bg-[#c90812] active:bg-[#b20710] shadow-sm',
    secondary: 'bg-zinc-100 text-zinc-950 hover:bg-white active:bg-zinc-200 shadow-sm',
    outline: 'border border-white/[0.12] text-zinc-200 hover:text-white hover:bg-white/[0.05] bg-transparent',
    ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]',
    danger: 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20',
    subtle: 'bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2 gap-2',
    lg: 'text-sm px-6 py-2.5 gap-2.5 font-semibold',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
