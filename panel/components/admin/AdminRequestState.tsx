import { getErrorMessage } from "@/lib/api/errors";

export type AdminRequest = {
  isPending: boolean;
  error: Error | null;
  refetch: () => unknown;
};

export function AdminRequestState({ request, label }: { request: AdminRequest; label: string }) {
  if (request.isPending) return <p role="status" className="text-sm text-gray-500">Loading {label}…</p>;
  if (!request.error) return null;

  return (
    <div role="alert" className="space-y-2 text-sm text-gray-600">
      <p>{getErrorMessage(request.error)}</p>
      <button type="button" onClick={() => request.refetch()} className="font-semibold text-brand hover:underline">
        Try again
      </button>
    </div>
  );
}
