import Image from "next/image";
import type { NavigationItem } from "./navigation-data";

export function MegaMenu({ item, onNavigate }: { item: NavigationItem; onNavigate: () => void }) {
  return (
    <div id={`mega-menu-${item.id}`} aria-labelledby={`navigation-${item.id}`} className="absolute inset-x-0 top-full hidden border-t border-[#eae8e4] bg-white text-[#252522] shadow-[0_24px_40px_-24px_rgba(0,0,0,0.28)] xl:block">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_1fr_1.3fr] gap-12 px-10 py-9">
        {item.groups.map((group) => (
          <div key={group.title}>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93918c]">{group.title}</p>
            <ul className="space-y-1">
              {group.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} onClick={onNavigate} className="group -mx-3 block cursor-pointer rounded-sm px-3 py-2.5 transition-colors hover:bg-[#f6f5f2] focus-visible:outline-2 focus-visible:outline-[#f4131b]">
                    <span className="flex items-center justify-between gap-3 text-[15px] font-medium"><span>{link.label}</span><span aria-hidden="true" className="text-[#f4131b] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">↗</span></span>
                    {link.description && <span className="mt-1 block text-xs leading-5 text-[#85827d]">{link.description}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <a href={item.feature.href} onClick={onNavigate} className="group relative min-h-[255px] cursor-pointer overflow-hidden bg-[#33322d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4131b]">
          <Image src={item.feature.image} alt="" fill sizes="(min-width: 1280px) 440px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-6 bottom-6 text-white">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/75">{item.feature.eyebrow}</p>
            <p className="mt-2 max-w-[280px] text-[25px] font-semibold leading-[1.2] tracking-[-0.025em]">{item.feature.title}</p>
            <p className="mt-2 max-w-[300px] text-xs leading-5 text-white/75">{item.feature.description}</p>
            <span className="mt-4 inline-flex items-center gap-3 text-xs font-medium">{item.feature.cta}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
          </div>
        </a>
      </div>
      <div className="border-t border-[#eeece8] bg-[#faf9f7]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-10 py-3.5 text-xs text-[#77746f]">
          <span>Thoughtful furniture. Made for everyday living.</span>
          <a href={item.href} onClick={onNavigate} className="inline-flex cursor-pointer items-center gap-3 font-medium text-[#252522] hover:text-[#f4131b] focus-visible:outline-2 focus-visible:outline-[#f4131b]">Explore all {item.label.toLowerCase()}<span aria-hidden="true">→</span></a>
        </div>
      </div>
    </div>
  );
}
