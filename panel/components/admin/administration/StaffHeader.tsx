import { Plus, UserCog } from "lucide-react";

export function StaffHeader({ onCreate, canCreate }: { onCreate: () => void; canCreate: boolean }) {
  return <header className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-brand"><UserCog size={15}/> Administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Staff Management</h1><p className="mt-1 text-sm text-gray-500">Create staff accounts, assign roles, and manage access status.</p></div>{canCreate && <button onClick={onCreate} className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark"><Plus size={16}/> Create Staff</button>}</header>;
}
