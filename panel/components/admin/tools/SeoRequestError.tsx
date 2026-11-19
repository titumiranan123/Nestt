import { getErrorMessage } from "@/lib/api/errors";

export function SeoRequestError({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  if (!error) return null;

  return <p role="alert" className="mb-4 border-l-2 border-red-500 bg-red-50 px-3 py-2.5 text-sm text-red-800">
    {getErrorMessage(error)}{" "}
    <button type="button" onClick={onRetry} className="font-semibold underline">Try again</button>
  </p>;
}
