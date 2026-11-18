"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPinned, Pencil, Plus, RefreshCw, Save, Search, Trash2, Truck } from "lucide-react";
import AdminDrawer from "@/components/admin/AdminDrawer";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";
import { deliveryApi, type DeliveryAreaInput, type DeliveryThana, type DeliveryZone, type DeliveryZoneConfig } from "@/features/delivery/api";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import { getErrorMessage } from "@/lib/api/errors";
import SettingsHeader from "./SettingsHeader";
import { SettingsMetric, settingsInput, settingsLabel } from "./SettingsPanel";

const areaKey = ["admin", "delivery", "areas"] as const;
const zoneKey = ["admin", "delivery", "zones"] as const;

type AreaDraft = {
  division: string;
  district: string;
  thana: string;
  deliveryZone: DeliveryZone;
  shippingFee: string;
  freeDeliveryAbove: string;
  isDeliverable: boolean;
};

const emptyArea = (): AreaDraft => ({
  division: "",
  district: "",
  thana: "",
  deliveryZone: "OUTSIDE_DHAKA",
  shippingFee: "",
  freeDeliveryAbove: "",
  isDeliverable: true,
});

const fallbackZones: DeliveryZoneConfig[] = [
  { zone: "INSIDE_DHAKA", flatFee: "60", isFree: false, minOrderFree: null, estimatedDaysMin: null, estimatedDaysMax: null, isActive: true },
  { zone: "OUTSIDE_DHAKA", flatFee: "120", isFree: false, minOrderFree: null, estimatedDaysMin: null, estimatedDaysMax: null, isActive: true },
];

function asAreaInput(draft: AreaDraft): DeliveryAreaInput {
  return {
    division: draft.division.trim(),
    district: draft.district.trim(),
    thana: draft.thana.trim(),
    deliveryZone: draft.deliveryZone,
    shippingFee: draft.shippingFee.trim() || null,
    freeDeliveryAbove: draft.freeDeliveryAbove.trim() || null,
    isDeliverable: draft.isDeliverable,
  };
}

export default function DeliveryManagementPage() {
  const queryClient = useQueryClient();
  const areasQuery = useQuery({ queryKey: areaKey, queryFn: deliveryApi.listAreas });
  const zonesQuery = useQuery({ queryKey: zoneKey, queryFn: deliveryApi.listZones });
  const divisions = areasQuery.data ?? [];
  const zones = fallbackZones.map((fallback) => zonesQuery.data?.find((zone) => zone.zone === fallback.zone) ?? fallback);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<{ id: string; division: string; district: string } | null>(null);
  const [draft, setDraft] = useState<AreaDraft>(emptyArea);
  const [savingArea, setSavingArea] = useState(false);
  const [savingZone, setSavingZone] = useState<DeliveryZone | null>(null);
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const areaRows = useMemo(() => divisions.flatMap((division) => division.districts.flatMap((district) =>
    district.thanas.map((thana) => ({ division, district, thana })),
  )), [divisions]);
  const districts = divisionFilter === "all"
    ? divisions.flatMap((division) => division.districts)
    : divisions.find((division) => division.id === divisionFilter)?.districts ?? [];
  const visibleAreas = areaRows.filter(({ division, district, thana }) => {
    const matchesSearch = !search.trim() || [division.name, district.name, thana.name].some((name) => name.toLowerCase().includes(search.trim().toLowerCase()));
    const matchesDivision = divisionFilter === "all" || division.id === divisionFilter;
    const matchesDistrict = districtFilter === "all" || district.id === districtFilter;
    const matchesZone = zoneFilter === "all" || thana.deliveryZone === zoneFilter;
    const matchesAvailability = availabilityFilter === "all" || String(thana.isDeliverable) === availabilityFilter;
    return matchesSearch && matchesDivision && matchesDistrict && matchesZone && matchesAvailability;
  });
  const blockedCount = areaRows.filter(({ thana }) => !thana.isDeliverable).length;

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: areaKey }),
      queryClient.invalidateQueries({ queryKey: zoneKey }),
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", "delivery-areas"] }),
    ]);
  };

  const openCreate = () => {
    const selectedDivision = divisions.find((division) => division.id === divisionFilter);
    const selectedDistrict = selectedDivision?.districts.find((district) => district.id === districtFilter);
    setEditingArea(null);
    setDraft({ ...emptyArea(), division: selectedDivision?.name ?? "", district: selectedDistrict?.name ?? "" });
    setEditorOpen(true);
  };

  const openEdit = (divisionName: string, districtName: string, thana: DeliveryThana) => {
    setEditingArea({ id: thana.id, division: divisionName, district: districtName });
    setDraft({
      division: divisionName,
      district: districtName,
      thana: thana.name,
      deliveryZone: thana.deliveryZone,
      shippingFee: thana.shippingFee ?? "",
      freeDeliveryAbove: thana.freeDeliveryAbove ?? "",
      isDeliverable: thana.isDeliverable,
    });
    setEditorOpen(true);
  };

  const saveArea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingArea(true);
    try {
      const input = asAreaInput(draft);
      const saved = editingArea
        ? await deliveryApi.updateArea(editingArea.id, {
            thana: input.thana,
            deliveryZone: input.deliveryZone,
            shippingFee: input.shippingFee,
            freeDeliveryAbove: input.freeDeliveryAbove,
            isDeliverable: input.isDeliverable,
          })
        : await deliveryApi.createArea(input);
      await invalidate();
      setEditorOpen(false);
      await showAdminNotice(`Delivery area ${editingArea ? "updated" : "created"}`, `${saved.name} has been saved.`, "success");
    } catch (error) {
      await showAdminNotice("Could not save delivery area", getErrorMessage(error), "error");
    } finally {
      setSavingArea(false);
    }
  };

  const removeArea = async (thana: DeliveryThana) => {
    if (!await confirmAdminAction(`Delete ${thana.name}?`, "This delivery area will be removed. Areas used by saved addresses or orders cannot be deleted.")) return;
    try {
      await deliveryApi.removeArea(thana.id);
      await invalidate();
      await showAdminNotice("Delivery area deleted", `${thana.name} has been removed.`, "success");
    } catch (error) {
      await showAdminNotice("Could not delete delivery area", getErrorMessage(error), "error");
    }
  };

  const toggleAvailability = async (thana: DeliveryThana) => {
    try {
      await deliveryApi.updateArea(thana.id, {
        thana: thana.name,
        deliveryZone: thana.deliveryZone,
        shippingFee: thana.shippingFee,
        freeDeliveryAbove: thana.freeDeliveryAbove,
        isDeliverable: !thana.isDeliverable,
      });
      await invalidate();
    } catch (error) {
      await showAdminNotice("Could not update delivery availability", getErrorMessage(error), "error");
    }
  };

  const saveZone = async (config: DeliveryZoneConfig) => {
    setSavingZone(config.zone);
    try {
      await deliveryApi.saveZone(config);
      await invalidate();
      await showAdminNotice("Delivery zone saved", "The zone default fee and delivery settings are saved.", "success");
    } catch (error) {
      await showAdminNotice("Could not save delivery zone", getErrorMessage(error), "error");
    } finally {
      setSavingZone(null);
    }
  };

  if (areasQuery.isPending || zonesQuery.isPending) return <AdminLoadingSkeleton kind="page" label="Loading delivery setup" />;
  if (areasQuery.isError || zonesQuery.isError) {
    const error = areasQuery.error ?? zonesQuery.error;
    return <section className="rounded-2xl border border-red-100 bg-white p-8 text-center"><h2 className="font-semibold text-gray-800">Could not load delivery setup</h2><p className="mt-1 text-sm text-red-700">{getErrorMessage(error)}</p><button type="button" onClick={() => { void areasQuery.refetch(); void zonesQuery.refetch(); }} className="mt-4 rounded-lg border border-brand/20 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">Try again</button></section>;
  }

  return <div className="animate-fade-up space-y-5">
    <SettingsHeader eyebrow="Delivery operations" title="Delivery Zone Management" description="Manage Bangladesh delivery areas and the default fee for each delivery zone." icon={Truck} actions={<button type="button" onClick={() => { void areasQuery.refetch(); void zonesQuery.refetch(); }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"><RefreshCw size={14}/>Refresh</button>} />

    <section className="grid gap-3 sm:grid-cols-3">
      <SettingsMetric icon={MapPinned} label="Divisions" value={divisions.length} detail="Loaded from the delivery API" />
      <SettingsMetric icon={MapPinned} label="Delivery areas" value={areaRows.length} detail="Thana / Upazila records" tone="blue" />
      <SettingsMetric icon={Truck} label="Unavailable areas" value={blockedCount} detail="Orders blocked at checkout" tone="amber" />
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      {zones.map((config) => <ZoneEditor key={config.zone} config={config} saving={savingZone === config.zone} onSave={saveZone} />)}
    </section>

    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div><h2 className="text-sm font-bold text-gray-900">Delivery areas</h2><p className="mt-1 text-xs text-gray-500">Create, edit, and manage deliverability for a division, district, and thana.</p></div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-bold text-white"><Plus size={14}/>Add delivery area</button>
      </header>
      <div className="grid gap-2 border-b border-line bg-gray-50/60 p-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="relative sm:col-span-2 xl:col-span-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input aria-label="Search delivery areas" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search areas..." className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-brand/40"/></label>
        <select aria-label="Filter by division" value={divisionFilter} onChange={(event) => { setDivisionFilter(event.target.value); setDistrictFilter("all"); }} className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-gray-600"><option value="all">All divisions</option>{divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}</select>
        <select aria-label="Filter by district" value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-gray-600"><option value="all">All districts</option>{districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}</select>
        <select aria-label="Filter by delivery zone" value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-gray-600"><option value="all">All zones</option><option value="INSIDE_DHAKA">Inside Dhaka</option><option value="OUTSIDE_DHAKA">Outside Dhaka</option></select>
        <select aria-label="Filter by deliverability" value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-gray-600"><option value="all">All statuses</option><option value="true">Deliverable</option><option value="false">Blocked</option></select>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-400"><tr><th className="px-5 py-3">Division</th><th className="px-3 py-3">District</th><th className="px-3 py-3">Thana / Upazila</th><th className="px-3 py-3">Zone</th><th className="px-3 py-3">Area fee</th><th className="px-3 py-3">Availability</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">
        {visibleAreas.map(({ division, district, thana }) => <tr key={thana.id} className="hover:bg-gray-50/70"><td className="px-5 py-3">{division.name}</td><td className="px-3 py-3">{district.name}</td><td className="px-3 py-3 font-semibold text-gray-800">{thana.name}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${thana.deliveryZone === "INSIDE_DHAKA" ? "bg-brand-soft text-brand" : "bg-amber-50 text-amber-700"}`}>{thana.deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"}</span></td><td className="px-3 py-3">{thana.shippingFee == null ? "Zone default" : `৳${thana.shippingFee}`}</td><td className="px-3 py-3"><button type="button" onClick={() => void toggleAvailability(thana)} className={`rounded-full px-2 py-1 text-[10px] font-semibold ${thana.isDeliverable ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{thana.isDeliverable ? "Deliverable" : "Blocked"}</button></td><td className="px-5 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={() => openEdit(division.name, district.name, thana)} className="grid size-8 place-items-center rounded-md text-gray-400 hover:bg-brand-soft hover:text-brand" aria-label={`Edit ${thana.name}`}><Pencil size={14}/></button><button type="button" onClick={() => void removeArea(thana)} className="grid size-8 place-items-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${thana.name}`}><Trash2 size={14}/></button></div></td></tr>)}
        {!visibleAreas.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No delivery areas match these filters.</td></tr>}
      </tbody></table></div>
      <footer className="border-t border-line bg-gray-50/50 px-5 py-3 text-[10px] text-gray-500">Showing {visibleAreas.length} of {areaRows.length} delivery areas</footer>
    </section>

    <AdminDrawer open={editorOpen} onClose={() => setEditorOpen(false)} title={`${editingArea ? "Edit" : "Add"} delivery area`} description="Configure the delivery area and its checkout availability.">
      <form onSubmit={saveArea} className="flex min-h-full flex-col">
        <div className="flex-1 space-y-4 p-5">
          <Field label="Division"><input required maxLength={100} className={settingsInput} disabled={Boolean(editingArea)} value={draft.division} onChange={(event) => setDraft((current) => ({ ...current, division: event.target.value }))} placeholder="Dhaka"/></Field>
          <Field label="District"><input required maxLength={100} className={settingsInput} disabled={Boolean(editingArea)} value={draft.district} onChange={(event) => setDraft((current) => ({ ...current, district: event.target.value }))} placeholder="Dhaka"/></Field>
          <Field label="Thana / Upazila"><input required maxLength={100} className={settingsInput} value={draft.thana} onChange={(event) => setDraft((current) => ({ ...current, thana: event.target.value }))} placeholder="Gulshan"/></Field>
          <Field label="Delivery zone"><select className={settingsInput} value={draft.deliveryZone} onChange={(event) => setDraft((current) => ({ ...current, deliveryZone: event.target.value as DeliveryZone }))}><option value="INSIDE_DHAKA">Inside Dhaka</option><option value="OUTSIDE_DHAKA">Outside Dhaka</option></select></Field>
          <Field label="Area fee (৳), optional"><input className={settingsInput} inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" value={draft.shippingFee} onChange={(event) => setDraft((current) => ({ ...current, shippingFee: event.target.value }))} placeholder="Use zone default"/></Field>
          <Field label="Free delivery above (৳), optional"><input className={settingsInput} inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" value={draft.freeDeliveryAbove} onChange={(event) => setDraft((current) => ({ ...current, freeDeliveryAbove: event.target.value }))} placeholder="No threshold"/></Field>
          <label className="flex items-center gap-2 rounded-xl border border-line p-3 text-xs font-medium text-gray-700"><input type="checkbox" checked={draft.isDeliverable} onChange={(event) => setDraft((current) => ({ ...current, isDeliverable: event.target.checked }))}/>Deliverable at checkout</label>
        </div>
        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-white px-5 py-4"><button type="button" disabled={savingArea} onClick={() => setEditorOpen(false)} className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 disabled:opacity-50">Cancel</button><button type="submit" disabled={savingArea} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"><Save size={14}/>{savingArea ? "Saving…" : editingArea ? "Save changes" : "Create area"}</button></footer>
      </form>
    </AdminDrawer>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className={settingsLabel}>{label}</span>{children}</label>;
}

function ZoneEditor({ config, saving, onSave }: { config: DeliveryZoneConfig; saving: boolean; onSave: (config: DeliveryZoneConfig) => void }) {
  const [value, setValue] = useState(config);
  const [error, setError] = useState("");
  useEffect(() => setValue(config), [config]);
  const label = config.zone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka";
  return <form onSubmit={(event) => { event.preventDefault(); setError(""); if (value.estimatedDaysMin != null && value.estimatedDaysMax != null && value.estimatedDaysMax < value.estimatedDaysMin) { setError("Maximum delivery days must be greater than or equal to minimum days."); return; } onSave(value); }} className="space-y-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
    <h2 className="text-sm font-bold text-gray-900">{label} default</h2>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Default fee (৳)"><input required className={settingsInput} inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" value={value.flatFee} onChange={(event) => setValue({ ...value, flatFee: event.target.value })}/></Field>
      <Field label="Free delivery above (৳), optional"><input className={settingsInput} inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" value={value.minOrderFree ?? ""} onChange={(event) => setValue({ ...value, minOrderFree: event.target.value || null })}/></Field>
      <Field label="Minimum days"><input className={settingsInput} type="number" min="0" value={value.estimatedDaysMin ?? ""} onChange={(event) => setValue({ ...value, estimatedDaysMin: event.target.value ? Number(event.target.value) : null })}/></Field>
      <Field label="Maximum days"><input className={settingsInput} type="number" min="0" value={value.estimatedDaysMax ?? ""} onChange={(event) => setValue({ ...value, estimatedDaysMax: event.target.value ? Number(event.target.value) : null })}/></Field>
    </div>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3"><div className="flex gap-4 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={value.isFree} onChange={(event) => setValue({ ...value, isFree: event.target.checked })}/>Always free</label><label className="flex items-center gap-2"><input type="checkbox" checked={value.isActive} onChange={(event) => setValue({ ...value, isActive: event.target.checked })}/>Active</label></div><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Save size={13}/>{saving ? "Saving…" : "Save zone"}</button></div>
  </form>;
}
