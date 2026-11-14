"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { siteFont as heroFont } from "@/lib/fonts";
import { ArIcon } from "@/components/shared/ArIcon";

const slides = [
  { image: "/assets/figma-home/hero-banner.png", alt: "Cognac leather sofa with teal cushions beneath framed artwork in a warmly styled living room" },
  { image: "/assets/figma-home/hero-banner.png", alt: "Cognac leather sofa with teal cushions beneath framed artwork in a warmly styled living room" },
  { image: "/assets/figma-home/hero-banner.png", alt: "Cognac leather sofa with teal cushions beneath framed artwork in a warmly styled living room" },
];

export function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(1);
  const [previewSlide, setPreviewSlide] = useState(0);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);

  function changeSlide(index: number) {
    setActiveSlide((index + slides.length) % slides.length);
  }

  return (
    <section
      id="home"
      aria-label="Featured furniture collections"
      aria-roledescription="carousel"
      className={`${heroFont.className} relative isolate h-[900px] w-full overflow-hidden bg-[#292621] text-white max-[767px]:h-[720px]`}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); changeSlide(activeSlide + 1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); changeSlide(activeSlide - 1); }
      }}
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = touchStart.current - event.changedTouches[0].clientX;
        if (Math.abs(distance) > 50) changeSlide(activeSlide + (distance > 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      {slides.map((slide, index) => (
        <div key={`${slide.image}-${index}`} aria-hidden={activeSlide !== index} className={`absolute inset-0 -z-20 transition-opacity duration-700 motion-reduce:transition-none ${activeSlide === index ? "opacity-100" : "opacity-0"}`}>
          <Image src={slide.image} alt={slide.alt} fill sizes="100vw" loading={index === 1 ? "eager" : "lazy"} preload={index === 1} className="object-cover object-center" />
          <div className={`absolute inset-0 ${index === 1 ? "bg-black/15" : "bg-black/45"}`} />
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-black/35" />

      <div className="absolute inset-x-0 top-[36.5%] flex flex-col items-center px-5 text-center max-[767px]:top-[32%]">
        <h1 className="text-[48px] font-bold leading-[1.2] tracking-[-0.01em] max-[767px]:text-[34px]">Quality You Can Feel</h1>
        <p className="mt-7 max-w-[680px] text-[24px] font-light leading-[1.35] tracking-[-0.015em] text-white/95 max-[767px]:mt-5 max-[767px]:text-[18px]">
          Reimagine your interiors with distinctive furniture,<br className="hidden sm:block" /> inspiring designs, and details.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 max-[767px]:mt-8">
          <a href="#recommended" className="inline-flex h-[52px] min-w-[125px] cursor-pointer items-center justify-center bg-[#ed1c24] px-6 text-[16px] font-semibold leading-6 transition-colors hover:bg-[#d80d15] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Shop Now</a>
          <Link href="/room-planner" className="inline-flex h-[52px] min-w-[125px] cursor-pointer items-center justify-center gap-2.5 border border-white/35 bg-black/15 px-5 text-[15px] font-medium leading-6 transition-colors hover:border-white hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><ArIcon className="size-6" />Design your room</Link>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[17px] flex justify-center pb-1.5 pt-0.5" role="group" aria-label="Choose a featured collection">
        {slides.map((slide, index) => <button key={index} type="button" aria-label={`Show collection ${index + 1}`} aria-pressed={activeSlide === index} onClick={() => changeSlide(index)} className="flex size-[22px] cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"><span className={`size-3.5 rounded-full transition-colors ${activeSlide === index ? "bg-white" : "bg-white/25 hover:bg-white/65"}`} /></button>)}
      </div>

      <button type="button" onClick={() => previewDialog.current?.showModal()} aria-label="Open living room preview" className="group absolute bottom-12 right-5 h-[117px] w-[208px] cursor-pointer overflow-hidden border border-white/20 bg-[#6b5a45] text-left shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white max-[767px]:bottom-16 max-[767px]:h-[82px] max-[767px]:w-[146px]">
        <Image src="/assets/figma-home/hero-preview.png" alt="" fill sizes="208px" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
        <span className="absolute bottom-2 left-2 flex size-7 items-center justify-center bg-black/60"><svg className="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 2.7a.7.7 0 0 1 1.1-.6l7.1 5.3a.7.7 0 0 1 0 1.2l-7.1 5.3a.7.7 0 0 1-1.1-.6Z" /></svg></span>
      </button>

      <dialog ref={previewDialog} aria-labelledby="room-preview-title" className="fixed inset-0 m-auto w-[min(92vw,880px)] max-w-none overflow-hidden border-0 bg-[#171817] p-0 text-white shadow-2xl backdrop:bg-black/75" onClick={(event) => { if (event.target === event.currentTarget) previewDialog.current?.close(); }}>
        <div className="flex items-center justify-between gap-4 px-5 py-4"><h2 id="room-preview-title" className="text-lg font-semibold">A closer look at your next space</h2><button type="button" autoFocus onClick={() => previewDialog.current?.close()} aria-label="Close room preview" className="flex size-10 cursor-pointer items-center justify-center text-3xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">×</button></div>
        <div className="relative aspect-[16/10]"><Image src={slides[previewSlide].image} alt={slides[previewSlide].alt} fill sizes="880px" className="object-cover" /></div>
        <div className="flex items-center justify-between gap-4 p-5"><button type="button" onClick={() => setPreviewSlide((previewSlide + 1) % slides.length)} className="cursor-pointer border border-white/40 px-4 py-2 text-sm hover:bg-white/10">Next room →</button><a href="#recommended" onClick={() => previewDialog.current?.close()} className="cursor-pointer bg-[#f4131b] px-4 py-2 text-sm hover:bg-[#d80d15]">Shop the collection</a></div>
      </dialog>
    </section>
  );
}
