"use client";

import { useState } from 'react';
import { CreditCard, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import { SettingsPanel } from './SettingsPanel';
import PaymentGatewayTabs, { gatewayTabs, type GatewayId } from './PaymentGatewayTabs';
import PaymentGatewayFields, { gatewayMeta, type GatewayData } from './PaymentGatewayFields';
import PaymentGatewayToggle from './PaymentGatewayToggle';
import { showAdminNotice } from '@/lib/admin-swal';

const defaults: Record<GatewayId, GatewayData> = {
  ssl: { store_id: '', store_pass: '', status: false, is_sandbox: true },
};

const statusKey: Record<GatewayId, string> = { ssl: 'status' };

export default function PaymentSettingsPage() {
  const [active, setActive] = useState<GatewayId>('ssl');
  const [configs, setConfigs] = useState(defaults);
  const [saved, setSaved] = useState(defaults);
  const current = configs[active];
  const dirty = JSON.stringify(configs) !== JSON.stringify(saved);
  const setValue = (key: string, value: string | boolean) =>
    setConfigs((previous) => ({ ...previous, [active]: { ...previous[active], [key]: value } }));
  const reset = () => setConfigs((previous) => ({ ...previous, [active]: { ...saved[active] } }));

  return (
    <div className="space-y-4">
      <SettingsHeader
        eyebrow="Checkout configuration"
        title="Payment Settings"
        description="Configure SSL Commerz. Cash on delivery is available at checkout without gateway credentials."
        icon={CreditCard}
      />
      <SettingsPanel
        title="Payment Gateway Configuration"
        description="Configure SSL Commerz credentials and status."
        action={dirty ? <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700">Unsaved changes</span> : null}
      >
        <PaymentGatewayTabs
          active={active}
          statuses={{ ssl: Boolean(configs.ssl.status) }}
          onChange={setActive}
        />
        <div className="space-y-6 p-5 sm:p-6">
          <PaymentGatewayFields gateway={active} values={current} onChange={setValue} />
          <div className="space-y-3">
            <PaymentGatewayToggle
              label={gatewayMeta[active].toggle}
              description={gatewayMeta[active].toggleDescription}
              checked={Boolean(current[statusKey[active]])}
              onChange={(value) => setValue(statusKey[active], value)}
            />
            {gatewayMeta[active].sandbox && (
              <PaymentGatewayToggle
                label="Sandbox mode"
                description="Use sandbox endpoints. Turn this off only for live credentials."
                checked={Boolean(current.is_sandbox)}
                onChange={(value) => setValue('is_sandbox', value)}
              />
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              <RefreshCw size={14} />Reset
            </button>
            <button
              onClick={() => {
                setSaved((previous) => ({ ...previous, [active]: { ...configs[active] } }));
                void showAdminNotice('Configuration saved', `${gatewayTabs.find((tab) => tab.id === active)?.label} settings saved locally.`, 'success');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-dark"
            >
              <Save size={14} />Save SSL Commerz
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-line bg-brand-soft/50 px-5 py-3.5 text-[11px] text-brand">
          <ShieldCheck size={14} />Credentials remain in local demo state and are never sent to an API.
        </div>
      </SettingsPanel>
    </div>
  );
}
