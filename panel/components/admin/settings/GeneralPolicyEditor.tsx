"use client";

import { FileText, RotateCcw, ShieldCheck } from "lucide-react";
import type { PolicyKey } from "@/features/settings/general";

export const policyTabs = [
  { id: "policy_refund", label: "Refund/Return Policy", icon: RotateCcw },
  { id: "policy_privacy", label: "Privacy Policy", icon: ShieldCheck },
  { id: "policy_terms", label: "Terms of Service", icon: FileText },
  { id: "policy_shipping", label: "Shipping Policy", icon: FileText },
] as const;

type GeneralPolicyEditorProps = {
  active: PolicyKey;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

export default function GeneralPolicyEditor({ active, value, disabled, onChange }: GeneralPolicyEditorProps) {
  const activeTab = policyTabs.find(({ id }) => id === active);

  return (
    <div className="space-y-4 p-5">
      <div>
        <h3 className="text-sm font-bold text-gray-900">{activeTab?.label}</h3>
        <p className="mt-1 text-xs text-gray-500">Edit the policy text available to your storefront.</p>
      </div>
      <textarea
        aria-label="Policy content"
        value={value}
        readOnly={disabled}
        onChange={(event) => onChange(event.target.value)}
        maxLength={100_000}
        rows={12}
        className="w-full resize-y rounded-xl border border-gray-200 px-4 py-4 text-sm leading-7 text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand"
        placeholder="Write your store policy..."
      />
    </div>
  );
}
