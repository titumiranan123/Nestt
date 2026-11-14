import { useState } from "react";
import { navigationItems } from "./navigation-data";

export function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  const [expanded, setExpanded] = useState<string | null>("products");

  return (
    <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-76px)] overflow-y-auto overscroll-contain border-t border-[#eae8e4] bg-white px-5 pb-6 text-[#252522] shadow-xl xl:hidden">
      {navigationItems.map((item) => (
        <div key={item.id} className="border-b border-[#eeece8]">
          <button type="button" id={`mobile-trigger-${item.id}`} aria-expanded={expanded === item.id} aria-controls={`mobile-group-${item.id}`} onClick={(event) => { const trigger = event.currentTarget; setExpanded(expanded === item.id ? null : item.id); requestAnimationFrame(() => trigger.scrollIntoView({ block: "nearest", behavior: "instant" })); }} className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left text-base font-medium focus-visible:outline-2 focus-visible:outline-[#f4131b]">
            {item.label}<span aria-hidden="true" className={`text-xl font-normal transition-transform ${expanded === item.id ? "rotate-45 text-[#f4131b]" : ""}`}>+</span>
          </button>
          {expanded === item.id && <div id={`mobile-group-${item.id}`} aria-labelledby={`mobile-trigger-${item.id}`} className="grid gap-6 pb-6 sm:grid-cols-2">
            {item.groups.map((group) => <div key={group.title}><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#96928b]">{group.title}</p><ul>{group.links.map((link) => <li key={link.label}><a href={link.href} onClick={onNavigate} className="block cursor-pointer py-2.5 text-sm text-[#55514a] hover:text-[#f4131b] focus-visible:outline-2 focus-visible:outline-[#f4131b]">{link.label}</a></li>)}</ul></div>)}
            <a href={item.href} onClick={onNavigate} className="inline-flex w-fit cursor-pointer items-center gap-3 border-b border-[#f4131b] pb-1 text-sm font-medium text-[#f4131b]">Explore all {item.label.toLowerCase()}<span aria-hidden="true">→</span></a>
          </div>}
        </div>
      ))}
      <a href="mailto:hello@nestt.home" onClick={onNavigate} className="mt-6 inline-flex cursor-pointer text-xs text-[#77746f]">Need a hand? Talk to our team ↗</a>
    </nav>
  );
}
