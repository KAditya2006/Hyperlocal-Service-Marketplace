import React from 'react';

export const Table = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div className="w-full overflow-x-auto custom-scrollbar border border-slate-200/80 rounded-2xl bg-white elevation-1">
    <table ref={ref} className={`w-full text-left text-sm text-slate-700 ${className}`} {...props}>
      {children}
    </table>
  </div>
));

Table.displayName = 'Table';

export const TableHeader = ({ children, className = '', ...props }) => (
  <thead className={`bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '', ...props }) => (
  <tbody className={`divide-y divide-slate-100 font-medium ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', hover = true, ...props }) => (
  <tr className={`transition-colors ${hover ? 'hover:bg-slate-50/60' : ''} ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHead = ({ children, className = '', ...props }) => (
  <th className={`px-4 sm:px-6 py-3.5 font-bold ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '', ...props }) => (
  <td className={`px-4 sm:px-6 py-3.5 ${className}`} {...props}>
    {children}
  </td>
);

export default Table;
