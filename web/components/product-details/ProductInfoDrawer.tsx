"use client";

import { useEffect, useRef, useState } from "react";
import { catalogImageUrl, type CatalogProduct, type ProductSpecification } from "@/lib/catalog";

export type ProductInfoSection = "Description" | "Features" | "Specifications" | "Care & maintenance";

export function ProductInfoDrawer({
  activeInfo,
  description,
  features,
  specification,
  careItems,
  onClose,
}: {
  activeInfo: ProductInfoSection | null;
  description?: string | null;
  features: string[];
  specification: ProductSpecification;
  careItems?: CatalogProduct["careItems"];
  onClose: () => void;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activeInfo && !dialog.open) dialog.showModal();
    if (!activeInfo && dialog.open) dialog.close();
  }, [activeInfo]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function requestClose() {
    if (!activeInfo || isClosing) return;

    setIsClosing(true);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 320;
    closeTimer.current = setTimeout(() => {
      setIsClosing(false);
      closeTimer.current = null;
      onClose();
    }, delay);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="product-info-title"
      data-closing={isClosing || undefined}
      onClose={onClose}
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}
      className="product-info-dialog fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 text-[#222] backdrop:bg-black/40"
    >
      <aside className={`product-info-drawer ml-auto flex h-full w-[min(420px,92vw)] flex-col bg-white shadow-2xl ${isClosing ? "product-info-drawer--closing" : ""}`}>
        <header className="flex min-h-[64px] items-center justify-between border-b border-[#e9e9e9] px-6">
          <h2 id="product-info-title" className="text-[18px] font-semibold">{activeInfo}</h2>
          <button
            type="button"
            autoFocus
            onClick={requestClose}
            aria-label="Close product information"
            className="flex size-9 cursor-pointer items-center justify-center text-[26px] leading-none text-[#555] hover:bg-[#f5f5f5]"
          >
            ×
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-6 text-[13px] leading-6 text-[#5f5f5f]">
          {activeInfo === "Description" && <p className="whitespace-pre-line">{description}</p>}
          {activeInfo === "Features" && <ul className="list-disc space-y-2 pl-5">
            {features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>}
          {activeInfo === "Specifications" && <ProductSpecifications specification={specification} />}
          {activeInfo === "Care & maintenance" && <ul className="space-y-4">
            {careItems?.map((item) => <li key={item.id}>
              <h3 className="font-semibold text-[#333]">{item.title}</h3>
              {item.description && <p className="whitespace-pre-line">{item.description}</p>}
            </li>)}
          </ul>}
        </div>
      </aside>
    </dialog>
  );
}

function ProductSpecifications({ specification }: { specification: ProductSpecification }) {
  const image = catalogImageUrl(specification.image);

  return (
    <>
      {image && <img src={image} alt="Product specification diagram" className="mb-4 h-auto w-full" />}
      {!!specification.specs?.length && <dl className="divide-y divide-[#ededed]">
        {specification.specs.map(({ id, label, value }) => (
          <div key={id} className="grid grid-cols-[minmax(0,1fr)_1.1fr] gap-4 py-3">
            <dt className="text-[#777]">{label}</dt>
            <dd className="font-medium text-[#333]">{value}</dd>
          </div>
        ))}
      </dl>}
    </>
  );
}
