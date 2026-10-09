import React from 'react';

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-[#050608] text-zinc-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`p-4 sm:p-5 pb-2 sm:pb-3 flex flex-col space-y-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3 className={`font-mono text-sm tracking-wider uppercase text-zinc-200 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-xs text-zinc-500 font-sans ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-4 sm:p-5 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`p-4 sm:p-5 pt-0 flex items-center border-t border-white/[0.04] mt-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
