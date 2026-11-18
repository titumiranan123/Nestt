type ProductIconKind = "heart" | "truck" | "shield" | "chair" | "dimensions" | "room" | "cart" | "orbit";

export function PlusIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
      <path d="M10 3.5v13M3.5 10h13" />
    </svg>
  );
}

export function ProductIcon({ kind, className = "size-4" }: { kind: ProductIconKind; className?: string }) {
  const shapes = {
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    chair: <><path d="M5 12V5h14v7M5 12h14v7H5zM8 19v2m8-2v2M5 12l-2 7m16-7 2 7" /></>,
    dimensions: <><ellipse cx="7.5" cy="8" rx="5.5" ry="3" /><path d="M2 8v7c0 1.7 2.5 3 5.5 3H22v-7h-9M6 14v3.5m4-3.5v3.5m4-3.5v3.5m4-3.5v3.5" /></>,
    room: <><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3" /><path d="m12 7 5 3v5l-5 3-5-3v-5l5-3Zm-5 3 5 3 5-3m-5 3v5" /></>,
    cart: <><path d="M3 4h2l2.5 11h10L20 8H6" /><circle cx="9" cy="19" r="1" /><circle cx="17" cy="19" r="1" /></>,
    orbit: <><path d="M21 10c1.9-3.6 1-6.2-1.8-7-3.1-.9-8 1-12 4.7C3.2 11.4 1.4 16 3 18.6c1.7 2.5 6.9 1.7 11.8-1.8l2.1-1.6m-4-.2 4.2.1-.4 4.1" /></>,
  };

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {shapes[kind]}
    </svg>
  );
}
