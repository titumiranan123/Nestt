"use client";

import { createElement, useEffect, useRef, useState } from "react";
import type { ArAsset } from "@/lib/ar-assets";
import { getArAssetUrl } from "@/lib/ar-assets";

type ModelViewerElement = HTMLElement & { canActivateAR?: boolean };

export function ArModelViewer({ asset }: { asset: ArAsset }) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [arAvailable, setArAvailable] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    void import("@google/model-viewer")
      .then(() => {
        if (active) setViewerReady(true);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const updateArSupport = () => {
      setArAvailable(Boolean(viewer.canActivateAR));
    };
    const handleModelError = () => setLoadError(true);
    viewer.addEventListener("load", updateArSupport);
    viewer.addEventListener("error", handleModelError);
    updateArSupport();

    return () => {
      viewer.removeEventListener("load", updateArSupport);
      viewer.removeEventListener("error", handleModelError);
    };
  }, [viewerReady]);

  if (loadError) {
    return <div role="alert" className="grid h-full min-h-[360px] place-items-center bg-[#f4f1eb] p-8 text-center text-sm text-[#655f55]">The 3D model could not be loaded. Please try again.</div>;
  }

  if (!viewerReady) {
    return <div aria-live="polite" className="grid h-full min-h-[360px] place-items-center bg-[#f4f1eb] text-sm text-[#655f55]">Loading 3D model…</div>;
  }

  const viewer = createElement(
    "model-viewer" as any,
    {
      ref: viewerRef,
      src: getArAssetUrl(asset),
      alt: `${asset.name} 3D model`,
      ...(asset.placement === "floor" ? { ar: "", "ar-modes": "scene-viewer quick-look webxr", "ar-scale": "fixed", "ar-placement": "floor" } : {}),
      "camera-controls": "",
      "touch-action": "pan-y",
      "shadow-intensity": "1",
      "environment-image": "neutral",
      "interaction-prompt": "auto",
      loading: "eager",
      style: { display: "block", width: "100%", height: "100%", minHeight: "360px", backgroundColor: "#f4f1eb" },
    },
    createElement(
      "button",
      {
        slot: "ar-button",
        type: "button",
        className: "absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#f15a22] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-lg hover:bg-[#d74a15] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25231f]",
        hidden: asset.placement !== "floor" || arAvailable !== true,
      },
      "Place in your room",
    ),
  );

  return (
    <div className="relative h-full min-h-[360px] bg-[#f4f1eb]">
      {viewer}
      <p aria-live="polite" className="absolute bottom-2 right-3 max-w-[55%] text-right text-[10px] text-[#655f55]">
        {asset.placement !== "floor" ? "Wall and ceiling models are 3D previews until surface placement is ready." : arAvailable === false ? "AR is unavailable on this device. Rotate the 3D model instead." : "Drag or swipe to rotate the model."}
      </p>
    </div>
  );
}
