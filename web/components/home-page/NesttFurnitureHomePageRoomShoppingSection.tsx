import Image from "next/image";
import { homePageRoomLinks } from "./nestt-furniture-home-page-content";

export function NesttFurnitureHomePageRoomShoppingSection() {
  return (
    <section className="bg-white px-5 py-12" id="rooms">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex min-h-[60px] items-start justify-between gap-8 max-[767px]:flex-col">
          <h2 className="text-[40px] font-semibold leading-[44px] tracking-[-0.035em] text-[#2c292a] max-[767px]:text-[32px]">Shop By Room</h2>
          <p className="max-w-[519px] text-right text-[20px] leading-[1.5] text-[#575757] max-[767px]:text-left max-[767px]:text-base">Discover furniture that brings comfort, style, and functionality to every corner of your home.</p>
        </div>
        <div className="mt-10 grid grid-cols-4 gap-3 max-[767px]:grid-cols-2">
          {homePageRoomLinks.map((room) => (
            <a className="group flex min-w-0 flex-col gap-4" href="#recommended" key={room.name}>
              <div className="relative aspect-[413/551] w-full overflow-hidden bg-[#ede9e1]">
                <Image className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" src={room.image} alt={room.name} fill sizes="(max-width: 767px) 50vw, 25vw" />
              </div>
              <span className="inline-flex items-center gap-1 text-[16px] font-medium leading-6 text-[#575757] underline underline-offset-2">{room.name}<span aria-hidden="true" className="text-xl leading-none">›</span></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
