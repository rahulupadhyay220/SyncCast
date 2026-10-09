import React from 'react';

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value = 0,
  onChange,
  className = '',
  ...props
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className={`w-full accent-[#e50914] cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none focus:outline-none ${className}`}
      {...props}
    />
  );
}
