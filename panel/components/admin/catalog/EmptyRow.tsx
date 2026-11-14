export function EmptyRow({ columns, kind }: { columns: number; kind: string }) {
  return <tr><td colSpan={columns} className="px-5 py-12 text-center"><p className="text-sm font-semibold text-gray-700">No {kind} found</p><p className="mt-1 text-xs text-gray-500">Try changing the search or filters.</p></td></tr>;
}
