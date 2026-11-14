"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductIcon } from "./ProductDetailsIcons";

type GalleryView = "photo" | "360" | "dimensions" | "room";

const galleryTools: { id: Exclude<GalleryView, "photo">; label: string }[] = [
  { id: "360", label: "360° View" },
  { id: "dimensions", label: "Dimensions" },
  { id: "room", label: "Try in Your Space" },
];

export function ProductGallery({ image, productName }: { image: string; productName: string }) {
  const [view, setView] = useState<GalleryView>("photo");
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="min-w-0">
      <div className="group relative aspect-[1.25] overflow-hidden bg-[#f4f1e9]">
        <Image
          src={image}
          alt={`Olive green ${productName} in a bright living room`}
          fill
          preload
          sizes="(max-width: 767px) 100vw, 62vw"
          className={`object-cover transition-transform duration-700 ${view === "photo" ? "group-hover:scale-[1.015]" : "scale-[1.08]"}`}
        />
        <button
          type="button"
          onClick={() => setIsSaved(!isSaved)}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isSaved}
          className={`absolute right-3 top-3 flex size-9 cursor-pointer items-center justify-center bg-white/95 ${isSaved ? "text-[#f15a22]" : "text-[#333] hover:text-[#f15a22]"}`}
        >
          <ProductIcon kind="heart" />
        </button>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 bg-white/95 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setView("photo")}
            aria-label="View product photo"
            aria-pressed={view === "photo"}
            className={`relative h-[42px] w-[54px] overflow-hidden border-2 ${view === "photo" ? "border-[#f15a22]" : "border-transparent"}`}
          >
            <Image src={image} alt="" fill sizes="54px" className="object-cover" />
          </button>
          {galleryTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setView(tool.id)}
              aria-pressed={view === tool.id}
              className={`flex h-[42px] min-w-[52px] cursor-pointer flex-col items-center justify-center gap-0.5 px-1 text-[8px] leading-[10px] text-[#555] hover:bg-[#f4f3f1] ${view === tool.id ? "bg-[#f4f3f1]" : ""}`}
            >
              {tool.id === "360" ? <span className="text-[16px]">◌</span> : <ProductIcon kind={tool.id} />}
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
