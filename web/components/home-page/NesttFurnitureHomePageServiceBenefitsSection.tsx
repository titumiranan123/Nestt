import { homePageServiceBenefits } from "./nestt-furniture-home-page-content";

function BenefitMark({ index }: { index: number }) {
  const paths = ["M12 3v18M3 12h18", "M4 12l5 5L20 6", "M3 7h18M6 12h12M9 17h6", "M12 3l2.7 5.5L21 9.4l-4.5 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.4l6.3-.9L12 3Z"];
  return <svg aria-hidden="true" className="size-7 shrink-0 text-[#f15a22]" viewBox="0 0 24 24" fill="none"><path d={paths[index % paths.length]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function NesttFurnitureHomePageServiceBenefitsSection() {
  return <section className="bg-white px-6 pb-6 pt-10"><div className="mx-auto grid max-w-[1392px] gap-3 sm:grid-cols-2 lg:grid-cols-4">{homePageServiceBenefits.map((benefit, index) => <article className="flex min-h-[112px] gap-4 bg-[#f6f6f6] px-5 py-5" key={benefit.title}><BenefitMark index={index}/><div><h3 className="text-[13px] font-semibold text-[#242424]">{benefit.title}</h3><p className="mt-2 text-[11px] leading-[1.55] text-[#777]">{benefit.description}</p></div></article>)}</div></section>;
}
