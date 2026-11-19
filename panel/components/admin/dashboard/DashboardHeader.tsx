import AdminIcon from "@/components/admin/AdminIcon";
import { dashboardPeriods, type DashboardPeriod } from "@/features/dashboard/types";

export function DashboardHeader({
  period,
  onPeriodChange,
}: {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-brand/10    p-4 sm:flex-row sm:items-center sm:px-5">
      <div>
        <p className="mb-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-brand">
          <span className="size-1.5 rounded-full bg-accent" />
          Store overview
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor your store performance for the selected period.
        </p>
      </div>
      <label className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-brand/15 bg-white px-3 text-brand shadow-sm">
        <AdminIcon name="calendar" size={16} />
        <select
          className="appearance-none border-0 bg-transparent text-sm font-semibold text-brand outline-none"
          value={period}
          aria-label="Dashboard reporting period"
          onChange={(event) => onPeriodChange(event.target.value as DashboardPeriod)}
        >
          {Object.entries(dashboardPeriods).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <AdminIcon className="text-accent" name="chev-down" size={14} />
      </label>
    </div>
  );
}
