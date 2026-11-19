import { Check, Headset, ShieldCheck, UserRoundCog } from "lucide-react";
import { roleLabels, type StaffRole } from "@/features/access/types";

const roles: { role: StaffRole; description: string; icon: typeof ShieldCheck; badge?: string }[] = [
  { role: "ADMIN", description: "Full system access and complete control.", icon: ShieldCheck, badge: "Current" },
  { role: "MANAGER", description: "Manage operations and team activities.", icon: UserRoundCog },
  { role: "SUPPORT", description: "View and manage customer requests.", icon: Headset },
];

export function RoleCards({ activeRole, roleCounts, total, onSelect }: { activeRole: StaffRole; roleCounts: Record<StaffRole, number>; total: number; onSelect: (role: StaffRole) => void }) {
  return <section className="grid gap-4 lg:grid-cols-3">{roles.map(({ role, description, icon: Icon, badge }) => { const active = activeRole === role; return <button key={role} type="button" onClick={() => onSelect(role)} className={`relative rounded-xl border bg-white p-4 text-left transition ${active ? "border-brand shadow-[0_10px_28px_rgba(7,85,121,.10)]" : "border-gray-200 hover:border-brand/40 hover:bg-brand-soft/15"}`}><div className="flex items-start gap-4"><span className={`grid size-12 shrink-0 place-items-center rounded-2xl border ${active ? "border-brand/20 bg-brand/10 text-brand" : "border-gray-200 bg-white text-gray-900"}`}><Icon size={24} strokeWidth={1.8}/></span><span className="min-w-0"><span className="flex items-center gap-2"><strong className="text-sm font-bold text-gray-950">{roleLabels[role]}</strong>{active&&badge&&<span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">{badge}</span>}</span><span className="mt-1 block min-h-10 text-sm leading-5 text-gray-500">{description}</span><span className="mt-2 block text-sm font-semibold text-gray-600">{roleCounts[role]} / {total} permissions</span></span></div>{active&&<span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-brand text-white"><Check size={14}/></span>}</button>; })}</section>;
}
