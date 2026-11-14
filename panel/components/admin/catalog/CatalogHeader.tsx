import Link from "next/link";
import { ChevronRight, Download, Plus } from "lucide-react";

export function CatalogHeader({
  eyebrow,
  title,
  description,
  singular,
  canCreate,
  onCreate,
  onExport,
}: {
  eyebrow: string;
  title: string;
  description: string;
  singular: string;
  canCreate: boolean;
  onCreate: () => void;
  onExport: () => void;
}) {
  return (
    <header className="mb-5 rounded-3xl border border-brand/10 bg-gradient-to-r from-brand-soft/60 via-white to-orange-50/50 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            <Link href="/admin" className="transition hover:text-accent">Dashboard</Link>
            <ChevronRight size={13} className="text-accent/70" />
            <span className="text-accent">{eyebrow}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onExport} className="inline-flex h-10 items-center gap-2 rounded-lg border border-accent/25 bg-white px-4 text-sm font-semibold text-accent transition hover:bg-orange-50">
            <Download size={15} /> Export
          </button>
          {canCreate && <button onClick={onCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark">
            <Plus size={16} /> Add {singular}
          </button>}
        </div>
      </div>
    </header>
  );
}
