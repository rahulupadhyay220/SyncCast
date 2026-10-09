import React from 'react';

export function Table({ className = '', children, ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={`w-full caption-bottom text-xs text-left border-collapse font-mono ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = '', children, ...props }) {
  return (
    <thead className={`border-b border-white/[0.08] text-zinc-500 uppercase text-[10px] tracking-wider ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...props }) {
  return (
    <tbody className={`divide-y divide-white/[0.04] text-zinc-300 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className = '', children, ...props }) {
  return (
    <tr
      className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className = '', isRowHeader, children, ...props }) {
  return (
    <th
      scope={isRowHeader ? 'row' : 'col'}
      className={`h-9 px-3 text-left align-middle font-normal text-zinc-400 text-[10px] uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className = '', children, ...props }) {
  return (
    <td
      className={`p-3 align-middle text-zinc-300 font-sans text-xs ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export default Table;
