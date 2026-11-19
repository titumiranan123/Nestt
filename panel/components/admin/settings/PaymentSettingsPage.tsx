"use client";

import { useState, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle, CheckCircle2, CreditCard, LoaderCircle, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import { SettingsPanel } from './SettingsPanel';
import PaymentGatewayTabs, { type GatewayId } from './PaymentGatewayTabs';
import PaymentGatewayFields, { gatewayMeta, type GatewayData } from './PaymentGatewayFields';
import PaymentGatewayToggle from './PaymentGatewayToggle';
import { usePaymentSettings, useSavePaymentSettings } from '@/features/payments/hooks';
import { confirmAdminAction } from '@/lib/admin-swal';
import { getErrorMessage } from '@/lib/api/errors';
import { can } from '@/lib/rbac/can';
import { isAdminRole } from '@/lib/rbac/roles';

const emptyCredentials: GatewayData = { store_id: '', store_pass: '' };

export default function PaymentSettingsPage() {
  const [active, setActive] = useState<GatewayId>('ssl');
  const { data: session, status: sessionStatus } = useSession();
  const canRead = isAdminRole(session?.user?.role) && can('settings:read', session?.user?.permissions);
  const canSave = canRead && can('settings:update', session?.user?.permissions);
  const settings = usePaymentSettings(canRead);
  const saveSettings = useSavePaymentSettings();
  const [credentials, setCredentials] = useState(emptyCredentials);
  const [statusDraft, setStatusDraft] = useState<boolean | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const savedStatus = settings.data?.ssl?.status ?? false;
  const credentialsConfigured = settings.data?.ssl?.credentialsConfigured ?? false;
  const status = statusDraft ?? savedStatus;
  const storeId = credentials.store_id.trim();
  const storePass = credentials.store_pass.trim();
  const dirty = Boolean(storeId || storePass || status !== savedStatus);
  const saving = confirming || saveSettings.isPending;

  const reset = () => {
    setCredentials(emptyCredentials);
    setStatusDraft(null);
    setFormVersion((version) => version + 1);
    setError('');
    setSuccess('');
  };

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || saving || !settings.data || !dirty) return;
    setError('');
    setSuccess('');
    if (!credentialsConfigured && (!storeId || !storePass)) {
      setError('Enter both the SSLCommerz Store ID and Store Password before saving for the first time.');
      return;
    }

    setConfirming(true);
    try {
      if (status !== savedStatus && !await confirmAdminAction(`${status ? 'Enable' : 'Disable'} SSLCommerz?`, status
        ? 'SSLCommerz will be available to customers at checkout after saving.'
        : 'SSLCommerz will be hidden from checkout after saving.')) return;

      await saveSettings.mutateAsync({
        ...(storeId ? { storeId } : {}),
        ...(storePass ? { storePass } : {}),
        ...(status !== savedStatus && { status }),
      });
      reset();
      setSuccess('SSLCommerz settings saved securely.');
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not save payment settings.'));
    } finally {
      saveSettings.reset();
      setConfirming(false);
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
          statuses={{ ssl: status }}
          onChange={setActive}
        />
        <div className="space-y-6 p-5 sm:p-6">
          {sessionStatus === 'loading' || (canRead && settings.isPending) ? <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm text-gray-500"><LoaderCircle className="animate-spin" size={17} />Loading payment settings…</div> : !canRead ? (
            <p className="text-sm text-gray-600">Payment settings require administrator access.</p>
          ) : !settings.data ? (
            <div role="alert" className="space-y-2 text-sm text-gray-600">
              <p>{getErrorMessage(settings.error, 'Could not load payment settings.')}</p>
              <button type="button" onClick={() => void settings.refetch()} className="font-semibold text-brand hover:underline">Try again</button>
            </div>
          ) : <form onSubmit={save} aria-busy={saving} className="space-y-6">
          <PaymentGatewayFields
            key={formVersion}
            gateway={active}
            values={credentials}
            disabled={!canSave || saving}
            onChange={(key, value) => { setCredentials((current) => ({ ...current, [key]: value })); setError(''); setSuccess(''); }}
            credentialsConfigured={credentialsConfigured}
          />
          <div className={`rounded-xl border px-4 py-3 text-xs ${credentialsConfigured ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            {credentialsConfigured ? 'SSLCommerz credentials are saved. Leave credential fields blank to keep their current values.' : 'Enter both credentials to configure SSLCommerz for the first time.'}
          </div>
          <div className="space-y-3">
            <PaymentGatewayToggle
              label={gatewayMeta[active].toggle}
              description={gatewayMeta[active].toggleDescription}
              checked={status}
              onChange={(value) => { setStatusDraft(value); setError(''); setSuccess(''); }}
              disabled={!canSave || saving || (!credentialsConfigured && (!storeId || !storePass))}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
            {!canSave && <p className="mr-auto self-center text-xs text-gray-600">You have view-only access to these settings.</p>}
            <button type="button" disabled={!canSave || saving || !dirty} onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw size={14} />Reset
            </button>
            <button
              type="submit"
              disabled={!canSave || saving || !dirty}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <LoaderCircle className="animate-spin" size={14} /> : <Save size={14} />}{saving ? 'Saving…' : 'Save SSL Commerz'}
            </button>
          </div>
          </form>}
        </div>
        <div className="flex items-center gap-2 border-t border-line bg-brand-soft/50 px-5 py-3.5 text-[11px] text-brand">
          <ShieldCheck size={14} />Credentials are encrypted by the backend and never included in settings responses.
        </div>
      </SettingsPanel>
    </div>
  );
}
