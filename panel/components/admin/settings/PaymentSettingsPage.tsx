"use client";

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, LoaderCircle, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import { SettingsPanel } from './SettingsPanel';
import PaymentGatewayTabs, { type GatewayId } from './PaymentGatewayTabs';
import PaymentGatewayFields, { gatewayMeta, type GatewayData } from './PaymentGatewayFields';
import PaymentGatewayToggle from './PaymentGatewayToggle';
import { paymentConfigApi } from '@/features/payments/api';
import { getErrorMessage } from '@/lib/api/errors';

const defaults: Record<GatewayId, GatewayData> = {
  ssl: { store_id: '', store_pass: '', status: false },
};

const statusKey: Record<GatewayId, string> = { ssl: 'status' };

export default function PaymentSettingsPage() {
  const [active, setActive] = useState<GatewayId>('ssl');
  const [configs, setConfigs] = useState(defaults);
  const [saved, setSaved] = useState(defaults);
  const [credentialsConfigured, setCredentialsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const current = configs[active];
  const dirty = JSON.stringify(configs) !== JSON.stringify(saved);

  useEffect(() => {
    let cancelled = false;
    void paymentConfigApi.get().then((settings) => {
      if (cancelled) return;
      const ssl = {
        store_id: '',
        store_pass: '',
        status: settings.ssl?.status ?? false,
      };
      setConfigs({ ssl });
      setSaved({ ssl });
      setCredentialsConfigured(settings.ssl?.credentialsConfigured ?? false);
    }).catch((reason: unknown) => {
      if (!cancelled) setError(getErrorMessage(reason, 'Could not load payment settings.'));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const setValue = (key: string, value: string | boolean) =>
    setConfigs((previous) => ({ ...previous, [active]: { ...previous[active], [key]: value } }));
  const reset = () => {
    setConfigs((previous) => ({ ...previous, [active]: { ...saved[active] } }));
    setError('');
    setSuccess('');
  };

  async function save() {
    setError('');
    setSuccess('');
    const config = configs.ssl;
    const storeId = String(config.store_id ?? '').trim();
    const storePass = String(config.store_pass ?? '').trim();
    if (!credentialsConfigured && (!storeId || !storePass)) {
      setError('Enter both the SSLCommerz Store ID and Store Password before saving for the first time.');
      return;
    }

    setSaving(true);
    try {
      const result = await paymentConfigApi.saveSsl({
        ...(storeId ? { storeId } : {}),
        ...(storePass ? { storePass } : {}),
        status: Boolean(config.status),
      });
      const next = { ssl: { store_id: '', store_pass: '', status: result.status } };
      setConfigs(next);
      setSaved(next);
      setCredentialsConfigured(result.credentialsConfigured);
      setSuccess('SSLCommerz settings saved securely.');
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not save payment settings.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <SettingsHeader
        eyebrow="Checkout configuration"
        title="Payment Settings"
        description="Manage encrypted SSLCommerz credentials and choose whether online payment appears at checkout. Cash on Delivery always remains available."
        icon={CreditCard}
      />
      <SettingsPanel
        title="Payment Gateway Configuration"
        description="Only enabled gateways are shown to customers at checkout. Credentials are never returned to the browser."
        action={dirty ? <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700">Unsaved changes</span> : null}
      >
        {error && <div role="alert" className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:mx-6"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</div>}
        {success && <div role="status" className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700 sm:mx-6"><CheckCircle2 size={15} className="mt-0.5 shrink-0" />{success}</div>}
        <PaymentGatewayTabs
          active={active}
          statuses={{ ssl: Boolean(configs.ssl.status) }}
          onChange={setActive}
        />
        <div className="space-y-6 p-5 sm:p-6">
          {loading ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-gray-500"><LoaderCircle className="animate-spin" size={17} />Loading payment settings…</div> : <>
          <PaymentGatewayFields gateway={active} values={current} onChange={(key, value) => { setValue(key, value); setError(''); setSuccess(''); }} credentialsConfigured={credentialsConfigured} />
          <div className={`rounded-xl border px-4 py-3 text-xs ${credentialsConfigured ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            {credentialsConfigured ? 'SSLCommerz credentials are saved. Leave the password blank to keep the current credential.' : 'SSLCommerz is not configured yet. Enter both credentials before enabling this payment method.'}
          </div>
          <div className="space-y-3">
            <PaymentGatewayToggle
              label={gatewayMeta[active].toggle}
              description={gatewayMeta[active].toggleDescription}
              checked={Boolean(current[statusKey[active]])}
              onChange={(value) => { setValue(statusKey[active], value); setError(''); setSuccess(''); }}
              disabled={!credentialsConfigured && (!String(current.store_id ?? '').trim() || !String(current.store_pass ?? '').trim())}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
            <button type="button" disabled={saving || !dirty} onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw size={14} />Reset
            </button>
            <button
              type="button"
              disabled={saving || !dirty}
              onClick={() => void save()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <LoaderCircle className="animate-spin" size={14} /> : <Save size={14} />}{saving ? 'Saving…' : 'Save SSL Commerz'}
            </button>
          </div>
          </>}
        </div>
        <div className="flex items-center gap-2 border-t border-line bg-brand-soft/50 px-5 py-3.5 text-[11px] text-brand">
          <ShieldCheck size={14} />Credentials are encrypted by the backend and never included in settings responses.
        </div>
      </SettingsPanel>
    </div>
  );
}
