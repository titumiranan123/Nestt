import { Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type GatewayId = 'ssl';

export const gatewayTabs: { id: GatewayId; label: string; icon: LucideIcon }[] = [
  { id: 'ssl', label: 'SSL Commerz', icon: Lock },
];

export default function PaymentGatewayTabs({
  active,
  statuses,
  onChange,
}: {
  active: GatewayId;
  statuses: Record<GatewayId, boolean>;
  onChange: (id: GatewayId) => void;
}) {
  return (
    <div className="border-b border-line bg-gray-50/80 p-2">
      <nav className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Payment gateways">
        {gatewayTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            onClick={() => onChange(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${active === id ? 'border-brand bg-brand text-white' : 'border-transparent bg-white text-gray-600 hover:border-brand/20 hover:text-brand'}`}
          >
            <Icon size={15} />
            <span>{label}</span>
            {statuses[id] && (
              <span className={`size-1.5 rounded-full ${active === id ? 'bg-white' : 'bg-green-500'}`} />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
