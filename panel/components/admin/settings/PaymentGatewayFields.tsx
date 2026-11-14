"use client";

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { settingsInput, settingsLabel } from './SettingsPanel';
import type { GatewayId } from './PaymentGatewayTabs';

export type GatewayData = Record<string, string | boolean>;

const sections: Record<
  GatewayId,
  {
    title: string;
    description: string;
    fields: { key: string; label: string; placeholder?: string; secret?: boolean }[];
    toggle: string;
    toggleDescription: string;
    sandbox?: boolean;
  }
> = {
  ssl: {
    title: 'SSL Commerz Configuration',
    description: 'Enter SSL Commerz store credentials.',
    fields: [
      { key: 'store_id', label: 'Store ID', placeholder: 'your_store_id' },
      { key: 'store_pass', label: 'Store Password', secret: true, placeholder: 'Enter store password' },
    ],
    toggle: 'Enable SSL Commerz',
    toggleDescription: 'Allow customers to pay via SSL Commerz.',
    sandbox: true,
  },
};

export default function PaymentGatewayFields({
  gateway,
  values,
  onChange,
}: {
  gateway: GatewayId;
  values: GatewayData;
  onChange: (key: string, value: string | boolean) => void;
}) {
  const config = sections[gateway];
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-line bg-gray-50/70 p-4">
        <h3 className="text-sm font-semibold text-gray-950">{config.title}</h3>
        <p className="mt-1 text-xs text-gray-500">{config.description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {config.fields.map((field) => (
          <label key={field.key}>
            <span className={settingsLabel}>{field.label}</span>
            <div className="relative">
              <input
                value={String(values[field.key] ?? '')}
                onChange={(event) => onChange(field.key, event.target.value)}
                type={field.secret && !visible[field.key] ? 'password' : 'text'}
                placeholder={field.placeholder}
                className={`${settingsInput} ${field.secret ? 'pr-10' : ''}`}
              />
              {field.secret && (
                <button
                  type="button"
                  onClick={() => setVisible((current) => ({ ...current, [field.key]: !current[field.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand"
                  aria-label={`Toggle ${field.label} visibility`}
                >
                  {visible[field.key] ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              )}
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}

export const gatewayMeta = sections;
