import React from 'react';

/**
 * Official SyncCast Logo Component
 * - Exact typography and dimensions from official brand assets
 * - Signature broadcast waves over 's' and 'C' matched to website cinema red (#e50914)
 * - Transparent background cropped to exact bounding box (aspect ratio ~3.43:1)
 * - Calibrated height and dimensions according to navbar default size (h-14 / 56px)
 * - Supports dark theme (crisp white text for dark navbar) and light theme
 * - Supports 'accent' variant (white 'sync' + radiant red 'Cast')
 */
export function Logo({
  theme = 'dark',     // 'dark' (white text) | 'light' (original dark text)
  size = 'md',        // 'sm' (28px) | 'md' (34px - default navbar size) | 'lg' (42px)
  variant = 'default', // 'default' (white text + red waves) | 'accent' (white sync + red Cast)
  className = '',
}) {
  // Calibrated height according to navbar height (h-14 / 56px)
  const sizeClasses = {
    sm: 'h-7',          // 28px
    md: 'h-[34px]',     // 34px - Golden ratio for 56px (h-14) navbar
    lg: 'h-10',         // 40px
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  let imageSrc = theme === 'light' ? '/logo-syncCast-original.png' : '/logo-syncCast-white.png';
  if (variant === 'accent' && theme === 'dark') {
    imageSrc = '/logo-theme-red-cast.png';
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={imageSrc}
        alt="SyncCast"
        className={`${currentSizeClass} w-auto object-contain transition-all duration-300 group-hover:scale-[1.03] group-hover:drop-shadow-[0_0_14px_rgba(229,9,20,0.55)]`}
        draggable={false}
        loading="eager"
      />
    </div>
  );
}

export default Logo;
