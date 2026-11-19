"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useSession } from "next-auth/react";
import { Eye, Hash, LoaderCircle, Save, Settings } from "lucide-react";
import { AdminRequestState } from "@/components/admin/AdminRequestState";
import { useGeneralSettings, useSaveGeneralSettings, type PolicyKey } from "@/features/settings/general";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import { can } from "@/lib/rbac/can";
import GeneralOrderFormat, { type OrderFormatDraft } from "./GeneralOrderFormat";
import GeneralPolicyEditor, { policyTabs } from "./GeneralPolicyEditor";
import SettingsHeader from "./SettingsHeader";
import { SettingsPanel } from "./SettingsPanel";

const defaultFormat = { prefix: "NST-", startNumber: "1001", suffix: "" };
const settingsTabs = [...policyTabs, { id: "order_format", label: "Order ID Format", icon: Hash }] as const;
type SettingsTab = (typeof settingsTabs)[number]["id"];

export default function GeneralSettingsPage() {
  const { data: session } = useSession();
  const settings = useGeneralSettings();
  const saveSettings = useSaveGeneralSettings();
  const [active, setActive] = useState<SettingsTab>("policy_refund");
  const [policyDrafts, setPolicyDrafts] = useState<Partial<Record<PolicyKey, string>>>({});
  const [formatDraft, setFormatDraft] = useState<OrderFormatDraft | null>(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const canEdit = can("settings:update", session?.user?.permissions);
  const saving = saveSettings.isPending;
  const stored = settings.data;
  const storedPolicies = new Map(stored?.policies.map((policy) => [policy.key, policy]));
  const activePolicy = active === "order_format" ? null : active;
  const policy = activePolicy ? storedPolicies.get(activePolicy) : undefined;
  const policyValue = activePolicy ? policyDrafts[activePolicy] ?? policy?.value ?? "" : "";
  const storedFormat = stored?.orderFormat;
  const baseFormat = storedFormat ? { ...storedFormat, startNumber: String(storedFormat.startNumber) } : defaultFormat;
  const format = formatDraft ?? baseFormat;
  const changedPolicies = policyTabs.flatMap(({ id }) => {
    const value = policyDrafts[id]?.trim();
    return value === undefined || value === (storedPolicies.get(id)?.value ?? "") ? [] : [{ key: id, value }];
  });
  const formatChanged = formatDraft !== null && (!storedFormat ||
    format.prefix.trim() !== storedFormat.prefix || format.suffix.trim() !== storedFormat.suffix || Number(format.startNumber) !== storedFormat.startNumber);
  const dirty = changedPolicies.length > 0 || formatChanged;

  function clearStatus() {
    setSaved(false);
    setError("");
  }

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = settingsTabs.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowLeft": next = index === 0 ? last : index - 1; break;
      case "ArrowRight": next = index === last ? 0 : index + 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
      default: return;
    }
    event.preventDefault();
    const id = settingsTabs[next].id;
    setActive(id);
    document.getElementById(`general-settings-tab-${id}`)?.focus();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || saving || !stored || !dirty) return;
    clearStatus();
    const emptyPolicy = changedPolicies.find(({ value }) => !value);
    if (emptyPolicy) {
      setActive(emptyPolicy.key);
      setError("Enter the policy text before saving.");
      return;
    }

    try {
      await saveSettings.mutateAsync({
        policies: changedPolicies,
        ...(formatChanged && { orderFormat: {
          prefix: format.prefix.trim(), startNumber: Number(format.startNumber), suffix: format.suffix.trim(),
        } }),
      });
      setPolicyDrafts({});
      setFormatDraft(null);
      setSaved(true);
    } catch (reason) {
      if (reason instanceof ApiError && Object.keys(reason.fieldErrors ?? {}).some((field) => field === "orderFormat" || field.startsWith("orderFormat."))) {
        setActive("order_format");
      }
      setError(getErrorMessage(reason, "Could not save general settings."));
    }
  }

  if (preview && stored && activePolicy) {
    const isDraft = changedPolicies.some(({ key }) => key === activePolicy);
    return (
      <div className="min-h-[calc(100vh-7rem)] rounded-2xl bg-white p-6 sm:p-10">
        <header className="mb-8 flex items-center justify-between border-b border-gray-100 pb-5">
          <div className="text-lg font-bold tracking-tight text-gray-900">nestt <span className="text-xs font-medium text-gray-400">Store policies</span></div>
          <button type="button" onClick={() => setPreview(false)} className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
            <Settings size={15} />Back to Admin
          </button>
        </header>
        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <nav aria-label="Store policies" className="flex flex-col gap-2">
            {policyTabs.map((tab) => (
              <button type="button" key={tab.id} onClick={() => setActive(tab.id)} aria-current={active === tab.id ? "true" : undefined} className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium ${active === tab.id ? "bg-brand text-white shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                {tab.label}
              </button>
            ))}
          </nav>
          <article className="max-w-3xl">
            <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">{policyTabs.find(({ id }) => id === active)?.label}</h1>
            <p className="whitespace-pre-line text-sm leading-7 text-gray-600">{policyValue || "No policy text yet."}</p>
            {isDraft ? <p className="mt-10 border-t border-gray-100 pt-6 text-xs text-gray-500">Unsaved preview</p> : policy && (
              <p className="mt-10 border-t border-gray-100 pt-6 text-xs text-gray-500">Last saved {new Date(policy.updatedAt).toLocaleDateString()}</p>
            )}
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SettingsHeader eyebrow="Store configuration" title="General Configuration" description="Manage storefront policies and order numbering preferences." icon={Settings} />
      <SettingsPanel
        title="Store Policies & Order Format"
        description="Edit each policy from its own tab and set numbering for new orders."
        action={stored && activePolicy && (
          <button type="button" onClick={() => setPreview(true)} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:border-brand/30 hover:text-brand disabled:opacity-50">
            <Eye size={15} />Preview
          </button>
        )}
      >
        {!stored ? (
          <div className="p-5"><AdminRequestState request={settings} label="general settings" /></div>
        ) : (
          <form onSubmit={save} aria-busy={saving}>
            <div className="border-b border-line bg-gray-50/80 p-2">
              <nav className="flex gap-2 overflow-x-auto" role="tablist" aria-label="General settings">
                {settingsTabs.map(({ id, label, icon: Icon }, index) => (
                  <button
                    key={id}
                    id={`general-settings-tab-${id}`}
                    type="button"
                    role="tab"
                    aria-selected={active === id}
                    aria-controls="general-settings-content"
                    tabIndex={active === id ? 0 : -1}
                    onClick={() => setActive(id)}
                    onKeyDown={(event) => navigateTabs(event, index)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${active === id ? "border-brand bg-brand text-white shadow-sm" : "border-transparent bg-white text-gray-600 hover:border-brand/20 hover:text-brand"}`}
                  >
                    <Icon size={15} />{label}
                  </button>
                ))}
              </nav>
            </div>
            <div id="general-settings-content" role="tabpanel" aria-labelledby={`general-settings-tab-${active}`}>
              {activePolicy ? (
                <GeneralPolicyEditor
                  active={activePolicy}
                  value={policyValue}
                  disabled={!canEdit || saving}
                  onChange={(value) => {
                    clearStatus();
                    setPolicyDrafts((current) => ({ ...current, [activePolicy]: value }));
                  }}
                />
              ) : (
                <GeneralOrderFormat
                  {...format}
                  nextNumber={storedFormat?.nextNumber}
                  configured={Boolean(storedFormat)}
                  disabled={!canEdit || saving}
                  onChange={(key, value) => {
                    clearStatus();
                    setFormatDraft((current) => ({ ...(current ?? baseFormat), [key]: value }));
                  }}
                  onUseDefault={() => {
                    clearStatus();
                    setFormatDraft(defaultFormat);
                  }}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-gray-50/60 px-5 py-4">
              <div className="text-xs">
                {error && <p role="alert" className="text-red-700">{error}</p>}
                {saved && <p role="status" className="text-green-800">General settings saved.</p>}
                {!canEdit && <p className="text-gray-600">You have view-only access to these settings.</p>}
              </div>
              <button type="submit" disabled={!canEdit || !dirty || saving} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </SettingsPanel>
    </div>
  );
}
