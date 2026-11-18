import { Check } from "lucide-react";

export function DrawerActions({ editing, singular, onClose, isSaving = false }: { editing: boolean; singular: string; onClose: () => void; isSaving?: boolean }) {
  return <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-4 sm:px-6"><button type="button" onClick={onClose} disabled={isSaving} className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"><Check size={15}/>{isSaving ? "Saving…" : editing ? "Save changes" : `Create ${singular}`}</button></div>;
}
