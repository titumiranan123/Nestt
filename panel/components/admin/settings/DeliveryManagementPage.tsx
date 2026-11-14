"use client";

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { LoaderCircle, MapPinned, RefreshCw, Save, Truck } from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import { SettingsMetric, settingsInput, settingsLabel } from './SettingsPanel';
import { apiClient } from '@/lib/api/client';
import { showAdminNotice } from '@/lib/admin-swal';

type Zone = 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
type Thana = {
  id: string;
  name: string;
  deliveryZone: Zone;
  shippingFee: string | null;
  isDeliverable: boolean;
  freeDeliveryAbove: string | null;
};
type District = { id: string; name: string; thanas: Thana[] };
type Division = { id: string; name: string; districts: District[] };
type ZoneConfig = {
  zone: Zone;
  flatFee: string;
  isFree: boolean;
  minOrderFree: string | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  isActive: boolean;
};

const emptyArea = {
  division: '',
  district: '',
  thana: '',
  deliveryZone: 'OUTSIDE_DHAKA' as Zone,
  shippingFee: '',
  freeDeliveryAbove: '',
  isDeliverable: true,
};

const emptyZones: ZoneConfig[] = [
  { zone: 'INSIDE_DHAKA', flatFee: '0', isFree: false, minOrderFree: null, estimatedDaysMin: null, estimatedDaysMax: null, isActive: false },
  { zone: 'OUTSIDE_DHAKA', flatFee: '0', isFree: false, minOrderFree: null, estimatedDaysMin: null, estimatedDaysMax: null, isActive: false },
];

export default function DeliveryManagementPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [zones, setZones] = useState<ZoneConfig[]>(emptyZones);
  const [area, setArea] = useState(emptyArea);
  const [loading, setLoading] = useState(true);
  const [savingArea, setSavingArea] = useState(false);
  const [savingZone, setSavingZone] = useState<Zone | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextDivisions, nextZones] = await Promise.all([
        apiClient<Division[]>('/admin/orders/delivery-areas'),
        apiClient<ZoneConfig[]>('/admin/orders/delivery-zones'),
      ]);
      setDivisions(nextDivisions);
      setZones(emptyZones.map((fallback) => nextZones.find((zone) => zone.zone === fallback.zone) ?? fallback));
    } catch (error) {
      void showAdminNotice('Could not load delivery setup', error instanceof Error ? error.message : 'Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const thanas = divisions.flatMap((division) => division.districts.flatMap((district) =>
    district.thanas.map((thana) => ({ division, district, thana })),
  ));
  const blocked = thanas.filter(({ thana }) => !thana.isDeliverable).length;

  const saveArea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingArea(true);
    try {
      await apiClient('/admin/orders/delivery-areas', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...area,
          shippingFee: area.shippingFee || null,
          freeDeliveryAbove: area.freeDeliveryAbove || null,
        }),
      });
      setArea(emptyArea);
      await refresh();
      void showAdminNotice('Delivery area saved', 'The Thana fee and availability are saved.', 'success');
    } catch (error) {
      void showAdminNotice('Could not save delivery area', error instanceof Error ? error.message : 'Please try again.', 'error');
    } finally {
      setSavingArea(false);
    }
  };

  const saveZone = async (config: ZoneConfig) => {
    setSavingZone(config.zone);
    try {
      await apiClient('/admin/orders/delivery-zones', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(config),
      });
      await refresh();
      void showAdminNotice('Delivery zone saved', 'The zone default fee is saved.', 'success');
    } catch (error) {
      void showAdminNotice('Could not save delivery zone', error instanceof Error ? error.message : 'Please try again.', 'error');
    } finally {
      setSavingZone(null);
    }
  };

  return (
    <div className="space-y-4">
      <SettingsHeader
        eyebrow="Delivery operations"
        title="Delivery Zone Management"
        description="Set default zone fees and per-Thana delivery charges in the Division → District → Thana hierarchy."
        icon={Truck}
        actions={<button onClick={() => void refresh()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"><RefreshCw size={14}/>Refresh</button>}
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <SettingsMetric icon={MapPinned} label="Divisions" value={divisions.length} detail="Stored in the database" />
        <SettingsMetric icon={MapPinned} label="Delivery areas" value={thanas.length} detail="Configured Thanas" tone="blue" />
        <SettingsMetric icon={Truck} label="Unavailable areas" value={blocked} detail="Orders blocked at checkout" tone="amber" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {zones.map((config) => (
          <ZoneEditor
            key={config.zone}
            config={config}
            saving={savingZone === config.zone}
            onSave={saveZone}
          />
        ))}
      </section>

      <form onSubmit={saveArea} className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2 xl:col-span-4">
          <h2 className="text-sm font-bold text-gray-900">Add or update a delivery area</h2>
          <p className="mt-1 text-xs text-gray-500">Saving a Thana automatically creates its Division and District when they are new.</p>
        </div>
        <Field label="Division"><input required maxLength={100} className={settingsInput} value={area.division} onChange={(event) => setArea({ ...area, division: event.target.value })} placeholder="Dhaka" /></Field>
        <Field label="District"><input required maxLength={100} className={settingsInput} value={area.district} onChange={(event) => setArea({ ...area, district: event.target.value })} placeholder="Dhaka" /></Field>
        <Field label="Thana / Upazila"><input required maxLength={100} className={settingsInput} value={area.thana} onChange={(event) => setArea({ ...area, thana: event.target.value })} placeholder="Gulshan" /></Field>
        <Field label="Delivery zone"><select className={settingsInput} value={area.deliveryZone} onChange={(event) => setArea({ ...area, deliveryZone: event.target.value as Zone })}><option value="INSIDE_DHAKA">Inside Dhaka</option><option value="OUTSIDE_DHAKA">Outside Dhaka</option></select></Field>
        <Field label="Thana fee (৳), optional"><input className={settingsInput} inputMode="decimal" pattern="[0-9]+(\\.[0-9]{1,2})?" value={area.shippingFee} onChange={(event) => setArea({ ...area, shippingFee: event.target.value })} placeholder="Use zone fee" /></Field>
        <Field label="Free above (৳), optional"><input className={settingsInput} inputMode="decimal" pattern="[0-9]+(\\.[0-9]{1,2})?" value={area.freeDeliveryAbove} onChange={(event) => setArea({ ...area, freeDeliveryAbove: event.target.value })} placeholder="No threshold" /></Field>
        <label className="flex items-center gap-2 self-end rounded-xl border border-line p-3 text-xs font-medium text-gray-700"><input type="checkbox" checked={area.isDeliverable} onChange={(event) => setArea({ ...area, isDeliverable: event.target.checked })} />Deliverable</label>
        <button disabled={savingArea || loading} className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white disabled:opacity-50"><Save size={14}/>{savingArea ? 'Saving…' : 'Save delivery area'}</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-bold text-gray-900">Configured Division → District → Thana areas</h2><p className="mt-1 text-xs text-gray-500">Checkout matches the selected location names against this hierarchy.</p></div>{loading && <LoaderCircle className="animate-spin text-brand" size={18}/>}</header>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-400"><tr><th className="px-5 py-3">Division</th><th className="px-3 py-3">District</th><th className="px-3 py-3">Thana / Upazila</th><th className="px-3 py-3">Zone</th><th className="px-3 py-3">Thana fee</th><th className="px-5 py-3">Availability</th></tr></thead><tbody className="divide-y divide-gray-100">{thanas.map(({ division, district, thana }) => <tr key={thana.id}><td className="px-5 py-3">{division.name}</td><td className="px-3 py-3">{district.name}</td><td className="px-3 py-3 font-semibold">{thana.name}</td><td className="px-3 py-3">{thana.deliveryZone === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'}</td><td className="px-3 py-3">{thana.shippingFee == null ? 'Zone default' : `৳${thana.shippingFee}`}</td><td className="px-5 py-3">{thana.isDeliverable ? 'Deliverable' : 'Blocked'}</td></tr>)}{!loading && thanas.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No delivery areas configured yet.</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label><span className={settingsLabel}>{label}</span>{children}</label>;
}

function ZoneEditor({ config, saving, onSave }: { config: ZoneConfig; saving: boolean; onSave: (config: ZoneConfig) => void }) {
  const [value, setValue] = useState(config);
  useEffect(() => setValue(config), [config]);
  const label = config.zone === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka';
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900">{label} default</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Default fee (৳)"><input className={settingsInput} inputMode="decimal" pattern="[0-9]+(\\.[0-9]{1,2})?" value={value.flatFee} onChange={(event) => setValue({ ...value, flatFee: event.target.value })} /></Field>
        <Field label="Free delivery above (৳), optional"><input className={settingsInput} inputMode="decimal" pattern="[0-9]+(\\.[0-9]{1,2})?" value={value.minOrderFree ?? ''} onChange={(event) => setValue({ ...value, minOrderFree: event.target.value || null })} /></Field>
        <Field label="Minimum days"><input className={settingsInput} type="number" min="0" value={value.estimatedDaysMin ?? ''} onChange={(event) => setValue({ ...value, estimatedDaysMin: event.target.value ? Number(event.target.value) : null })} /></Field>
        <Field label="Maximum days"><input className={settingsInput} type="number" min="0" value={value.estimatedDaysMax ?? ''} onChange={(event) => setValue({ ...value, estimatedDaysMax: event.target.value ? Number(event.target.value) : null })} /></Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex gap-4 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={value.isFree} onChange={(event) => setValue({ ...value, isFree: event.target.checked })}/>Always free</label><label className="flex items-center gap-2"><input type="checkbox" checked={value.isActive} onChange={(event) => setValue({ ...value, isActive: event.target.checked })}/>Active</label></div>
        <button disabled={saving} onClick={() => onSave(value)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Save size={13}/>{saving ? 'Saving…' : 'Save zone'}</button>
      </div>
    </div>
  );
}
