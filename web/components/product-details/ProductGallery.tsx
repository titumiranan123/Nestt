"use client";

import { useRef, useState } from "react";
import { ProductModelViewer, ProductRoomButton } from "@/components/ar/ArModelViewer";
import { catalogImageUrl, type ProductDetailVariant } from "@/lib/catalog";
import { ProductIcon } from "./ProductDetailsIcons";

const toolClass = "flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 bg-[#f5f5f5] px-1 text-center text-[10px] leading-3 text-[#303030] enabled:hover:bg-[#ececec] disabled:cursor-default lg:px-3 lg:text-xs lg:leading-[14px]";

export function ProductGallery({
  variant,
  productName,
  onDimensions,
}: {
  variant?: ProductDetailVariant;
  productName: string;
  onDimensions?: () => void;
}) {
  const [selectedPhoto, setSelectedPhoto] = useState<string>();
  const [modelMode, setModelMode] = useState<"360" | "room-unavailable">();
  const modelDialog = useRef<HTMLDialogElement>(null);
  const photos = (variant?.media ?? []).flatMap((media) => {
    const url = catalogImageUrl(media.url);
    return url && media.type?.toLowerCase() !== "video" ? [{ ...media, url }] : [];
  });
  const primaryPhoto = photos.find((photo) => photo.isPrimary) ?? photos[0];
  const photo = photos.find((entry) => entry.url === selectedPhoto) ?? primaryPhoto;
  const modelUrl = catalogImageUrl(variant?.arAsset?.modelUrl);
  const usdzUrl = catalogImageUrl(variant?.arAsset?.usdzUrl);
  const hasRoomView = modelUrl && variant?.arAsset?.placement === "floor";

  function openModel(mode: "360" | "room-unavailable") {
    modelDialog.current?.showModal();
    setModelMode(mode);
  }

  return (
    <section aria-label="Product gallery" className="min-w-0">
      <div data-product-photo className="relative aspect-[876/700] overflow-hidden bg-[#f4f1e9]">
        {photo && <img src={photo.url} alt={photo.alt || productName} fetchPriority="high" className="size-full object-cover" />}
        <div aria-label="Gallery views" role="group" className="absolute bottom-3 left-1/2 grid w-[280px] max-w-[calc(100%-1rem)] -translate-x-1/2 auto-rows-[48px] grid-cols-4 gap-1 bg-white p-1 md:w-[340px] md:auto-rows-[56px] md:gap-1.5 md:p-1.5 lg:bottom-5 lg:w-[440px] lg:auto-rows-[72px] lg:gap-2 lg:p-2">
          <button type="button" disabled={!primaryPhoto} onClick={() => setSelectedPhoto(primaryPhoto?.url)} aria-label="View main product photo"
            aria-pressed={!!primaryPhoto && photo?.url === primaryPhoto.url}
            className="cursor-pointer overflow-hidden border-2 border-transparent bg-[#f5f5f5] aria-pressed:border-[#f15a22] disabled:cursor-default">
            {primaryPhoto && <img src={primaryPhoto.url} alt="" className="size-full object-cover" />}
          </button>
          <button type="button" disabled={!modelUrl} onClick={() => openModel("360")} className={toolClass}>
            <ProductIcon kind="orbit" className="size-4 lg:size-5" />360° View
          </button>
          <button type="button" disabled={!onDimensions} onClick={onDimensions} className={toolClass}>
            <ProductIcon kind="dimensions" className="size-4 lg:size-5" />Dimensions
          </button>
          {hasRoomView ? (
            <ProductRoomButton src={modelUrl} iosSrc={usdzUrl} className={toolClass}
              onUnavailable={() => openModel("room-unavailable")}>
              <ProductIcon kind="room" className="size-4 lg:size-5" /><span>Try In Your<br />Space</span>
            </ProductRoomButton>
          ) : (
            <button type="button" disabled className={toolClass}>
              <ProductIcon kind="room" className="size-4 lg:size-5" /><span>Try In Your<br />Space</span>
            </button>
          )}
        </div>
      </div>
      {photos.length > 1 && <div className="mt-3 flex flex-wrap gap-2" aria-label="More product photos">
        {photos.map((entry, index) => (
          <button key={`${entry.url}-${index}`} type="button" aria-label={`View product photo ${index + 1}`}
            aria-pressed={photo?.url === entry.url} onClick={() => setSelectedPhoto(entry.url)}
            className="size-14 cursor-pointer overflow-hidden border border-[#e7e5e0] aria-pressed:border-[#f15a22] sm:size-16">
            <img src={entry.url} alt="" loading="lazy" className="size-full object-cover" />
          </button>
        ))}
      </div>}
      {modelUrl && <dialog ref={modelDialog} onClose={() => setModelMode(undefined)} aria-labelledby="product-model-title"
        className="fixed inset-0 m-auto w-[min(720px,96vw)] max-w-none bg-white text-[#222] shadow-xl backdrop:bg-black/45">
        <header className="flex items-center justify-between gap-4 border-b border-[#ececec] px-4 py-3">
          <h2 id="product-model-title" className="text-sm font-semibold">360° View</h2>
          <form method="dialog"><button aria-label="Close product model" className="size-8 cursor-pointer text-xl">×</button></form>
        </header>
        {modelMode === "room-unavailable" && (
          <p role="status" className="px-4 py-2 text-sm text-[#555]">Couldn’t open room view. You can rotate the model here.</p>
        )}
        {modelMode && <ProductModelViewer src={modelUrl} name={productName} allowAR={false} />}
      </dialog>}
    </section>
  );
}
