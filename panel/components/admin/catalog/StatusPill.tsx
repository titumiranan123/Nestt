export function StatusPill({ published }: { published: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>{published ? "Published" : "Draft"}</span>;
}
