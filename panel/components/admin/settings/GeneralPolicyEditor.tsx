"use client";
import { FileText, RotateCcw, ShieldCheck } from "lucide-react";

export const policyTabs = [
  { id: "refund", label: "Refund/Return Policy", icon: RotateCcw },
  { id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
  { id: "terms", label: "Terms of Service", icon: FileText },
  { id: "shipping", label: "Shipping Policy", icon: FileText },
] as const;

export default function GeneralPolicyEditor({ active, value, onTab, onChange }: { active: string; value: string; onTab: (id: string) => void; onChange: (value: string) => void }) {
  return <><div className="border-b border-line bg-gray-50/80 p-2"><nav className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Store policies">{policyTabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={active === id} onClick={() => onTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${active === id ? "border-brand bg-brand text-white shadow-sm" : "border-transparent bg-white text-gray-600 hover:border-brand/20 hover:text-brand"}`}><Icon size={15}/>{label}</button>)}</nav></div>
    <div className="space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-bold text-gray-900">{policyTabs.find((tab) => tab.id === active)?.label}</h3><p className="mt-1 text-xs text-gray-500">Write the policy customers will see on your storefront.</p></div><span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">Draft saved locally</span></div><div className="overflow-hidden rounded-xl border border-gray-200"><div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500"><span className="rounded px-2 py-1 text-gray-700">Normal text</span><span className="mx-1 h-4 w-px bg-gray-200"/><span className="rounded px-2 py-1 font-bold">B</span><span className="rounded px-2 py-1 italic">I</span><span className="rounded px-2 py-1 underline">U</span><span className="ml-auto text-[10px] font-medium">Rich text editor</span></div><textarea aria-label="Policy content" value={value} onChange={(event) => onChange(event.target.value)} rows={12} className="w-full resize-y border-0 px-4 py-4 text-sm leading-7 text-gray-700 outline-none placeholder:text-gray-400 focus:ring-0" placeholder="Write your store policy..." /></div><p className="text-[11px] text-gray-400">Plain text demo editor · content stays in this browser session.</p></div></>;
}
