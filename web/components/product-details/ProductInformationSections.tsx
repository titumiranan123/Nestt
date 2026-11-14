const productFeatures = [
  { number: "01", title: "A high-back silhouette", text: "A generous profile gives this lounge chair a calm, inviting presence in the room." },
  { number: "02", title: "A place to put your feet up", text: "The matching footrest completes the set and gives you room to stretch out." },
  { number: "03", title: "Made for slower moments", text: "Settle in with a book, take a quiet break, or make this your favourite seat at home." },
];

function ProductIcon({ kind }: { kind: "delivery" | "returns" | "support" }) {
  const shape = {
    delivery: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>,
    returns: <><path d="M3 11a9 9 0 1 1 2.6 6.4" /><path d="M3 4v7h7" /></>,
    support: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{shape[kind]}</svg>;
}

export function ProductInformationNavigation() {
  const links = [["The story", "#description"], ["Highlights", "#highlights"], ["Delivery", "#delivery-care"], ["Need help?", "#delivery-care"]];
  return (
    <nav aria-label="Product information" className="mt-12 grid grid-cols-2 border-y border-[#e7e7e7] sm:grid-cols-4">
      {links.map(([label, href]) => <a key={label} href={href} className="flex min-h-12 cursor-pointer items-center justify-center border-b border-[#e7e7e7] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#555] transition-colors hover:text-[#f15a22] sm:border-b-0 sm:even:border-l sm:[&:nth-child(n+3)]:border-l">{label}</a>)}
    </nav>
  );
}

export function ProductDescriptionSection() {
  return (
    <section id="description" className="grid scroll-mt-24 gap-7 bg-[#f6f5f2] px-6 py-8 sm:px-10 sm:py-11 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-16 lg:py-16">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f15a22]">Meet Oslo</p><h2 className="mt-3 max-w-[440px] text-[30px] font-semibold leading-[1.12] tracking-[-0.04em] sm:text-[38px]">Your favourite seat is waiting.</h2></div>
      <div className="max-w-[650px]">
        <p className="text-[14px] leading-6 text-[#4d4d4a]">Oslo pairs a high-back recliner with a matching footrest to create a dedicated place to pause. Its sculptural wood frame and warm brown finish make a statement while keeping the room feeling composed.</p>
        <p className="mt-4 text-[12px] leading-5 text-[#73736f]">Place it beside a reading lamp, by a window, or wherever you like to unwind. The listing price is for the Oslo lounge set shown.</p>
        <div className="mt-6 flex items-center gap-3 border-t border-[#deddd8] pt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#555]"><span className="h-px w-8 bg-[#f15a22]" /> Lounge seating, thoughtfully chosen</div>
      </div>
    </section>
  );
}

export function ProductHighlightsSection() {
  return (
    <section id="highlights" className="scroll-mt-24 py-14 sm:py-16">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f15a22]">A closer look</p><h2 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] sm:text-[36px]">The Oslo details</h2></div><p className="max-w-[340px] text-[12px] leading-5 text-[#73736f]">A comfortable profile, a matching footrest, and a warm wood-and-brown palette.</p></div>
      <div className="mt-7 grid border-y border-[#e7e7e7] md:grid-cols-3 md:divide-x md:divide-[#e7e7e7]">
        {productFeatures.map((feature) => <article key={feature.number} className="py-5 md:px-7 md:py-7 first:md:pl-0 last:md:pr-0"><span className="text-[24px] font-semibold leading-none text-[#f15a22]">{feature.number}</span><h3 className="mt-4 text-[14px] font-semibold">{feature.title}</h3><p className="mt-2 max-w-[320px] text-[12px] leading-5 text-[#73736f]">{feature.text}</p></article>)}
      </div>
    </section>
  );
}

export function ProductCareAssemblySection() {
  return (
    <section id="delivery-care" className="scroll-mt-24 pb-12">
      <div className="max-w-[580px]"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f15a22]">Here when you need us</p><h2 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] sm:text-[36px]">Delivery, care & support</h2><p className="mt-3 text-[13px] leading-6 text-[#73736f]">Get the practical details you need before your Oslo set makes itself at home.</p></div>
      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        {[
          { kind: "delivery" as const, title: "White-glove delivery", label: "Nationwide delivery and assembly", text: "Nestt’s delivery team can bring your furniture to its room and help with installation. Confirm address availability with our team." },
          { kind: "returns" as const, title: "14-day returns", label: "Try it in your space", text: "Nestt offers a 14-day return window. Contact support for eligibility, collection, and return details." },
          { kind: "support" as const, title: "Product support", label: "Questions before you order?", text: "Our team can help with product details, showroom visits, and current warranty information." },
        ].map((item) => <article key={item.title} className="border border-[#e7e7e7] p-5 sm:p-6"><span className="flex size-10 items-center justify-center rounded-full bg-[#f6f5f2] text-[#f15a22]"><ProductIcon kind={item.kind} /></span><h3 className="mt-4 text-[14px] font-semibold">{item.title}</h3><p className="mt-1 text-[11px] font-medium text-[#555]">{item.label}</p><p className="mt-3 text-[12px] leading-5 text-[#73736f]">{item.text}</p><a href="mailto:hello@nestt.com" className="mt-4 inline-block cursor-pointer text-[11px] font-semibold text-[#f15a22] underline underline-offset-4">Contact Nestt</a></article>)}
      </div>
    </section>
  );
}
