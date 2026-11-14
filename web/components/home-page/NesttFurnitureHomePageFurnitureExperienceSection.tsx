import Image from "next/image";
import Link from "next/link";
import { ArIcon } from "@/components/shared/ArIcon";
import { homePageExperienceCards } from "./nestt-furniture-home-page-content";

export function NesttFurnitureHomePageFurnitureExperienceSection() {
  return (
    <section className="bg-[#f5f5f5] px-5 py-6" id="inspiration">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid h-[516px] grid-cols-[1fr_1.035fr_1fr] max-[767px]:h-auto max-[767px]:grid-cols-1">
          <HomePageExperienceCard card={homePageExperienceCards[0]} />
          <div className="flex h-full flex-col items-center justify-center bg-white px-8 py-12 text-center">
            <h2 className="max-w-[400px] text-[40px] font-semibold leading-[1.1] tracking-[-0.035em] text-[#2c292a] max-[767px]:text-[32px]">Experience Furniture Like Never Before</h2>
            <p className="mt-4 max-w-[410px] text-[20px] leading-[1.5] text-[#575757] max-[767px]:text-base">Explore every detail, visualize furniture in your space, and discover your perfect fit before you buy.</p>
            <a className="mt-8 inline-flex h-[52px] min-w-[125px] items-center justify-center bg-[#f15a22] px-6 text-[14px] font-semibold text-white transition hover:bg-[#d74a15]" href="#recommended">Shop Now</a>
          </div>
          <HomePageExperienceCard card={homePageExperienceCards[1]} />
        </div>
        <div className="mt-3 grid h-[516px] grid-cols-2 gap-3 max-[767px]:h-auto max-[767px]:grid-cols-1">
          <HomePageExperienceCard card={homePageExperienceCards[2]} />
          <HomePageExperienceCard card={homePageExperienceCards[3]} />
        </div>
      </div>
    </section>
  );
}

function HomePageExperienceCard({ card }: { card: (typeof homePageExperienceCards)[number] }) {
  const isAr = card.action === "Try AR";
  return (
    <Link className="group relative flex h-full min-h-[340px] cursor-pointer flex-col justify-end overflow-hidden px-6 py-12 text-white max-[767px]:px-5 max-[767px]:py-8" href={isAr ? "/room-planner" : "#recommended"}>
      <Image className="object-cover transition duration-700 group-hover:scale-[1.03]" src={card.image} alt="" fill sizes="(max-width: 767px) 100vw, 50vw" />
      <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/45" />
      <div className="relative z-10">
        <span className="inline-flex rounded-full bg-black/25 px-4 py-2 text-[14px] font-medium leading-5 text-white">{card.title === "See Every Detail" ? "3D Product View" : card.title === "See It in Your Space" ? "Augmented Reality" : card.title === "Step Into Your Dream Home" ? "VR Showroom" : "Live Chat"}</span>
        <h3 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] max-[767px]:text-[32px]">{card.title}</h3>
        <p className="mt-3 max-w-[410px] text-[20px] leading-[1.35] text-white/90 max-[767px]:text-base">{card.description}</p>
        {isAr ? (
          <span className="mt-6 inline-flex h-[52px] items-center gap-2 border border-white/30 bg-black/15 px-5 text-[16px] font-medium"><ArIcon className="size-5" />Try AR</span>
        ) : (
          <span className="mt-5 inline-flex items-center gap-1 text-[16px] font-medium underline underline-offset-4">Explore <span aria-hidden="true" className="text-xl">›</span></span>
        )}
      </div>
    </Link>
  );
}
