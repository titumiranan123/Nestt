import Image from "next/image";

const footerGroups = [
  { title: "Spatial Suites", links: ["Living Room", "Bedroom", "Dining Room", "Home Office"] },
  { title: "Experience Centers", links: ["Virtual Showroom", "Find a Showroom", "Style Quiz", "Book a Consultation"] },
  { title: "Nestt Monograph", links: ["Our Story", "Journal", "Care Guide", "Contact Us"] },
];

export function NesttFurnitureHomePageFooter() {
  return (
    <footer className="min-h-[411.5px] bg-[#141517] px-6 pb-12 pt-16 text-white">
      <div className="mx-auto flex min-h-[299.5px] max-w-[1392px] flex-col justify-between">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-6">
          <div className="sm:col-span-2 lg:col-span-2 lg:pr-14">
            <a className="inline-flex h-9 w-[136px] cursor-pointer" href="#home" aria-label="Nestt home">
              <Image src="/assets/figma-home/hero-logo.png" alt="Nestt" width={136} height={36} className="h-9 w-[136px] object-cover" />
            </a>
            <p className="mt-4 max-w-[300px] text-[14px] leading-5 text-white/60">Thoughtful furniture, considered spaces, and details made for everyday living.</p>
            <a className="mt-5 block cursor-pointer text-[14px] leading-5 text-white/75" href="tel:+8809612345678">+880 9612 345 678</a>
            <a className="block cursor-pointer text-[14px] leading-5 text-white/75" href="mailto:hello@nestt.com">hello@nestt.com</a>
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[12px] font-semibold uppercase leading-5 tracking-[0.12em] text-white/65">{group.title}</h3>
              <div className="mt-4 grid gap-3">
                {group.links.map((link) => <a className="cursor-pointer text-[14px] leading-5 text-white/75 hover:text-white" href="#home" key={link}>{link}</a>)}
              </div>
            </div>
          ))}
          <div>
            <h3 className="text-[12px] font-semibold uppercase leading-5 tracking-[0.12em] text-white/65">The Nestt Letter</h3>
            <p className="mt-4 text-[14px] leading-5 text-white/60">Design notes, new collections, and inspiration for your home.</p>
            <form className="mt-5 flex border-b border-white/35 pb-2" action="#newsletter" method="get">
              <label className="sr-only" htmlFor="footer-newsletter-email">Your email address</label>
              <input id="footer-newsletter-email" name="email" type="email" placeholder="Your email address" className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/45" />
              <button className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.08em] text-[#f15a22]" type="submit">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-white/15 pt-5 text-[9px] uppercase leading-4 tracking-[0.12em] text-white/45 md:flex-row">
          <p>© 2026 Nestt Home. All rights reserved.</p>
          <p>Privacy Policy &nbsp; · &nbsp; Terms &nbsp; · &nbsp; Security</p>
          <p>White-Glove Service, Nationwide</p>
        </div>
      </div>
    </footer>
  );
}
