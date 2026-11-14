import { Eye, EyeOff } from "lucide-react";

export function PublishSwitch({ name, checked, onClick }: { name: string; checked: boolean; onClick: () => void }) {
  const Icon = checked ? Eye : EyeOff;
  return <button type="button" aria-label={`${checked ? "Unpublish" : "Publish"} ${name}`} aria-pressed={checked} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${checked ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}><Icon size={13}/>{checked ? "Live" : "Hidden"}</button>;
}
