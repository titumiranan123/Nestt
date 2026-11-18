"use client";

import { createElement, useEffect, useRef, useState, type ReactNode } from "react";
import type { ArAsset } from "@/lib/ar-assets";
import { getArAssetUrl } from "@/lib/ar-assets";

type ModelViewerElement = HTMLElement & {
  canActivateAR: boolean;
  activateAR(): Promise<void>;
};

function useModelViewer() {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let active = true;
    void import("@google/model-viewer")
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("failed");
      });

    return () => {
      active = false;
    };
  }, []);

  return status;
}

export function ArModelViewer({ asset }: { asset: ArAsset }) {
  return <ProductModelViewer src={getArAssetUrl(asset)} name={asset.name} allowAR={asset.placement === "floor"} />;
}

export function ProductRoomButton({ src, iosSrc, className, onUnavailable, children }: {
  src: string;
  iosSrc?: string;
  className: string;
  onUnavailable: () => void;
  children: ReactNode;
}) {
  const status = useModelViewer();
  const viewerRef = useRef<ModelViewerElement>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    function showFallback() {
      setOpening(false);
      onUnavailable();
    }

    function handleARStatus(event: Event) {
      if ((event as CustomEvent<{ status: string }>).detail.status === "failed") showFallback();
    }

    viewer.addEventListener("ar-status", handleARStatus);
    viewer.addEventListener("error", showFallback);
    return () => {
      viewer.removeEventListener("ar-status", handleARStatus);
      viewer.removeEventListener("error", showFallback);
    };
  }, [status, onUnavailable]);

  function openRoom() {
    const viewer = viewerRef.current;
    if (!viewer?.canActivateAR) {
      onUnavailable();
      return;
    }

    setOpening(true);
    // Native viewers require activation within the original tap handler.
    void viewer.activateAR().catch(onUnavailable).finally(() => setOpening(false));
  }

  return (
    <>
      <button type="button" onClick={openRoom} disabled={status === "loading" || opening}
        aria-busy={opening} className={className}>
        {opening ? "Opening AR…" : children}
      </button>
      {status === "ready" && createElement("model-viewer", {
        ref: viewerRef,
        hidden: true,
        style: { display: "none" },
        src,
        "ios-src": iosSrc,
        ar: true,
        "ar-modes": "scene-viewer quick-look",
        "ar-scale": "fixed",
        "ar-placement": "floor",
        loading: "lazy",
        reveal: "manual",
      })}
    </>
  );
}

export function ProductModelViewer({ src, name, allowAR }: { src: string; name: string; allowAR: boolean }) {
  const status = useModelViewer();
  const viewerRef = useRef<ModelViewerElement>(null);
  const [arAvailable, setArAvailable] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState(false);

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
  }, [status]);

  if (status === "failed" || loadError) {
    return <div role="alert" className="grid h-full min-h-[360px] place-items-center bg-[#f4f1eb] p-8 text-center text-sm text-[#655f55]">The 3D model could not be loaded. Please try again.</div>;
  }

  if (status === "loading") {
    return <div aria-live="polite" className="grid h-full min-h-[360px] place-items-center bg-[#f4f1eb] text-sm text-[#655f55]">Loading 3D model…</div>;
  }

  const viewer = createElement(
    "model-viewer",
    {
      ref: viewerRef,
      src,
      alt: `${name} 3D model`,
      ...(allowAR ? { ar: true, "ar-modes": "scene-viewer quick-look webxr", "ar-scale": "fixed", "ar-placement": "floor" } : {}),
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
        hidden: !allowAR || arAvailable !== true,
      },
      "Place in your room",
    ),
  );

  return (
    <div className="relative h-full min-h-[360px] bg-[#f4f1eb]">
      {viewer}
      <p aria-live="polite" className="absolute bottom-2 right-3 max-w-[55%] text-right text-[10px] text-[#655f55]">
        {allowAR && arAvailable === false ? "AR is unavailable on this device. Rotate the 3D model instead." : "Drag or swipe to rotate the model."}
      </p>
    </div>
  );
}
