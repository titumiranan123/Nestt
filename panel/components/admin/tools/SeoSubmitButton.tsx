import { Save } from "lucide-react";

type SeoSubmitButtonProps = {
  children: string;
  disabled?: boolean;
  sticky?: boolean;
};

export function SeoSubmitButton({ children, disabled = false, sticky = false }: SeoSubmitButtonProps) {
  const containerClass = sticky
    ? "sticky bottom-0 z-20 flex justify-end border-t border-gray-200 bg-white py-4 xl:col-span-2"
    : "flex justify-end border-t border-gray-200 pt-4";

  return (
    <div className={containerClass}>
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-secondary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save size={16} />
        {children}
      </button>
    </div>
  );
}
