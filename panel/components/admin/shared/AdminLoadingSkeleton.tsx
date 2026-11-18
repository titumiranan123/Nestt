type AdminLoadingSkeletonProps = {
  kind?: "page" | "table" | "catalog" | "editor" | "cards";
  label?: string;
  columns?: number;
};

const shimmer = "animate-pulse rounded bg-gray-200/80 motion-reduce:animate-none";

function Block({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`${shimmer} ${className}`} />;
}

export function AdminLoadingSkeleton({
  kind = "page",
  label = "Loading page data",
  columns = 4,
}: AdminLoadingSkeletonProps) {
  if (kind === "cards") {
    return <section role="status" aria-label={label} aria-busy="true" className="animate-fade-up space-y-5"><span className="sr-only">{label}</span><div className="rounded-2xl border border-gray-100 bg-white p-5"><Block className="h-3 w-32"/><Block className="mt-3 h-7 w-56 max-w-full"/><Block className="mt-3 h-4 w-full max-w-2xl"/></div><div className="grid gap-0 border-y border-gray-200 sm:grid-cols-3">{Array.from({length:3},(_,index)=><div key={index} className="min-h-32 border-gray-200 bg-white px-4 py-5 sm:px-5"><Block className="size-9 rounded-lg"/><Block className="mt-4 h-3 w-28"/><Block className="mt-2 h-7 w-20"/><Block className="mt-2 h-3 w-36"/></div>)}</div><div className="grid gap-4 md:grid-cols-2">{Array.from({length:4},(_,index)=><div key={index} className="rounded-2xl border border-gray-100 bg-white p-5"><Block className="h-5 w-36"/><Block className="mt-3 h-3 w-full"/><Block className="mt-2 h-3 w-4/5"/><Block className="mt-5 h-9 w-28 rounded-lg"/></div>)}</div></section>;
  }
  if (kind === "editor") {
    return (
      <section role="status" aria-label={label} aria-busy="true" className="animate-fade-up space-y-5">
        <span className="sr-only">{label}</span>
        <div className="rounded-3xl border border-brand/10 bg-white p-5 sm:p-6">
          <Block className="h-3 w-36" />
          <Block className="mt-4 h-8 w-56 max-w-full" />
          <Block className="mt-3 h-4 w-full max-w-2xl" />
          <div className="mt-6 flex gap-3"><Block className="h-10 w-24 rounded-lg" /><Block className="h-10 w-36 rounded-lg" /></div>
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-brand/10 bg-white p-2 md:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-11 rounded-lg" />)}
            </div>
            <div className="space-y-5 rounded-2xl border border-brand/10 bg-white p-5 sm:p-6">
              <Block className="h-6 w-44" /><Block className="h-4 w-72 max-w-full" />
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-2"><Block className="h-3 w-24" /><Block className="h-10 w-full rounded-lg" /></div>)}
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-brand/10 bg-white p-5"><Block className="h-5 w-32" /><Block className="h-4 w-full" /><Block className="h-4 w-4/5" /><Block className="h-10 w-full rounded-lg" /></div>
        </div>
      </section>
    );
  }

  const showStats = kind === "page";
  const rowCount = kind === "page" ? 5 : 7;
  return (
    <section role="status" aria-label={label} aria-busy="true" className="animate-fade-up space-y-5">
      <span className="sr-only">{label}</span>
      {kind !== "table" && <header className="rounded-3xl border border-brand/10 bg-white px-5 py-5 sm:px-6 sm:py-6">
        <Block className="h-3 w-36" /><Block className="mt-3 h-8 w-56 max-w-full" /><Block className="mt-3 h-4 w-full max-w-2xl" />
      </header>}
      {showStats && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="rounded-2xl border border-brand/10 bg-white p-4"><Block className="h-3 w-24" /><Block className="mt-3 h-7 w-16" /><Block className="mt-2 h-3 w-28" /></div>)}</div>}
      {kind !== "table" && <div className="flex flex-col gap-3 rounded-2xl border border-brand/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><Block className="h-10 w-full max-w-md rounded-lg" /><Block className="h-10 w-36 rounded-lg" /></div>}
      <div className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
        <div className="grid gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, index) => <Block key={index} className="h-3 w-20 max-w-full" />)}</div>
        {Array.from({ length: rowCount }, (_, index) => <div key={index} className="grid items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, column) => column === 0 ? <div key={column} className="flex items-center gap-3"><Block className="size-10 shrink-0 rounded-lg" /><div className="min-w-0 flex-1 space-y-2"><Block className="h-3 w-36 max-w-full" /><Block className="h-3 w-24 max-w-full" /></div></div> : <Block key={column} className={`h-3 ${column === columns - 1 ? "w-20" : "w-28"} max-w-full`} />)}</div>)}
      </div>
    </section>
  );
}
