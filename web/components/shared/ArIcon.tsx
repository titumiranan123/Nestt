export function ArIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="20" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m5.5 15 2.2-6h1.1l2.2 6m-4.8-2h4M13 15V9h2.1a1.7 1.7 0 0 1 0 3.4H13m2.1 0L18 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
