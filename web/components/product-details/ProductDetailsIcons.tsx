type ProductIconKind = "heart" | "truck" | "shield" | "chair" | "dimensions" | "room" | "cart";

export function PlusIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
      <path d="M10 3.5v13M3.5 10h13" />
    </svg>
  );
}

export function ProductIcon({ kind }: { kind: ProductIconKind }) {
  const shapes = {
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    chair: <><path d="M5 12V5h14v7M5 12h14v7H5zM8 19v2m8-2v2M5 12l-2 7m16-7 2 7" /></>,
    dimensions: <><path d="M4 4h16v16H4zM4 9h5M9 4v5M15 20v-5h5M15 15h5" /></>,
    room: <><path d="M3 11 12 4l9 7v9H3zM9 20v-6h6v6" /><path d="M17 7V4h2v5" /></>,
    cart: <><path d="M3 4h2l2.5 11h10L20 8H6" /><circle cx="9" cy="19" r="1" /><circle cx="17" cy="19" r="1" /></>,
  };

  return (
    <svg aria-hidden="true" className="size-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {shapes[kind]}
    </svg>
  );
}
