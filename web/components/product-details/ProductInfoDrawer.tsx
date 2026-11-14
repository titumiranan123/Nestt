"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductInfoSection } from "./product-details-data";

const productFeatures = [
  ["Steam-bent teak frame", "Solid teak is shaped with a smooth, flowing profile and hand-finished to bring out its natural grain."],
  ["Textured boucle upholstery", "Soft, tactile upholstery gives the cushions a warm and inviting finish."],
  ["Comfortable three-seat design", "Generously proportioned seating gives friends and family room to settle in."],
  ["Made for everyday use", "Thoughtful construction and durable materials suit daily lounging and entertaining."],
];

export function ProductInfoDrawer({
  activeInfo,
  size,
  fabric,
  onClose,
}: {
  activeInfo: ProductInfoSection | null;
  size: string;
  fabric: string;
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
          {activeInfo === "Description" && <ProductDescription />}
          {activeInfo === "Features" && <ProductFeatureList />}
          {activeInfo === "Specifications" && <ProductSpecifications size={size} fabric={fabric} />}
        </div>
      </aside>
    </dialog>
  );
}

function ProductDescription() {
  return (
    <div className="space-y-4">
      <p>The Aero Bentwood Premium Exclusive Sofa brings a sculptural teak frame and relaxed comfort together in one timeless centrepiece.</p>
      <p>Steam-bent curves give the frame its distinctive silhouette, while textured boucle cushions make it a welcoming place to gather and unwind.</p>
      <p>Designed for everyday living, its generous three-seat layout pairs naturally with warm wood, soft neutrals, and considered interiors.</p>
    </div>
  );
}

function ProductFeatureList() {
  return (
    <ul className="space-y-4">
      {productFeatures.map(([heading, description]) => (
        <li key={heading} className="list-none border-b border-[#ededed] pb-4">
          <h3 className="font-semibold text-[#292929]">{heading}</h3>
          <p className="mt-1">{description}</p>
        </li>
      ))}
    </ul>
  );
}

function ProductSpecifications({ size, fabric }: { size: string; fabric: string }) {
  const specifications = [
    ["Collection", "Aero Bentwood"],
    ["Configuration", size],
    ["Frame", "Steam-bent solid teak"],
    ["Upholstery", fabric],
    ["Seating capacity", "3 people"],
    ["Assembly", "Assembly included"],
    ["Care", "Professional upholstery cleaning recommended"],
    ["Warranty", "10 years"],
  ];

  return (
    <dl className="divide-y divide-[#ededed]">
      {specifications.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[minmax(0,1fr)_1.1fr] gap-4 py-3">
          <dt className="text-[#777]">{label}</dt>
          <dd className="font-medium text-[#333]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
