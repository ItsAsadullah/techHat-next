export const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 whitespace-nowrap">
    {children}
  </th>
);
export const TD = ({ children, right, bold, red, green }: { children: React.ReactNode; right?: boolean; bold?: boolean; red?: boolean; green?: boolean }) => (
  <td className={`px-3 py-2.5 text-sm border-b border-gray-100 ${right ? 'text-right font-mono' : ''} ${bold ? 'font-semibold' : ''} ${red ? 'text-red-600' : ''} ${green ? 'text-green-600' : ''}`}>
    {children}
  </td>
);
export const TotalRow = ({ cells }: { cells: React.ReactNode[] }) => (
  <tr className="bg-gray-50 border-t-2 border-gray-300">
    {cells.map((c, i) => (
      <td key={i} className="px-3 py-2.5 text-sm font-bold border-b border-gray-200 text-right font-mono last:first:text-left">
        {c}
      </td>
    ))}
  </tr>
);
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-green-100 text-green-700',
    PARTIAL: 'bg-yellow-100 text-yellow-700',
    DUE: 'bg-red-100 text-red-700',
    PENDING: 'bg-orange-100 text-orange-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
