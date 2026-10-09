import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

const DropdownContext = createContext({
  isOpen: false,
  setIsOpen: () => {},
  toggle: () => {},
  close: () => {},
});

export function DropdownMenuTrigger({ children, className = '', ...props }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, toggle, close }}>
      <div ref={containerRef} className={`relative inline-block text-left ${className}`} {...props}>
        {React.Children.map(children, (child) => {
          if (!child) return null;
          if (child.type?.name === 'DropdownMenu' || child.props?.placement !== undefined) {
            return child;
          }
          return React.cloneElement(child, {
            onClick: (e) => {
              child.props?.onClick?.(e);
              toggle();
            },
          });
        })}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenu({ children, className = '', placement = 'bottom end', ...props }) {
  const { isOpen } = useContext(DropdownContext);

  if (!isOpen) return null;

  const placementClasses = {
    'bottom end': 'right-0 top-full mt-1.5',
    'bottom start': 'left-0 top-full mt-1.5',
    'bottom': 'left-1/2 -translate-x-1/2 top-full mt-1.5',
  };

  return (
    <div
      role="menu"
      className={`absolute z-50 min-w-[9rem] overflow-hidden rounded-xl border border-white/[0.1] bg-[#0a0c10] p-1 text-zinc-200 shadow-2xl animate-fadeIn ${
        placementClasses[placement] || 'right-0 top-full mt-1.5'
      } ${className}`}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null;
        if (child.type?.name === 'DropdownMenuItem') {
          return React.cloneElement(child, {
            onClick: (e) => {
              child.props?.onClick?.(e);
            },
          });
        }
        return child;
      })}
    </div>
  );
}

export function DropdownMenuItem({ children, className = '', variant = 'default', onClick, ...props }) {
  const variantClasses = {
    default: 'text-zinc-300 hover:bg-white/[0.05] hover:text-white',
    destructive: 'text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium',
  };

  return (
    <div
      role="menuitem"
      onClick={onClick}
      className={`relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none transition-colors ${
        variantClasses[variant] || variantClasses.default
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className = '', ...props }) {
  return <div className={`-mx-1 my-1 h-px bg-white/[0.06] ${className}`} {...props} />;
}

export default DropdownMenu;
