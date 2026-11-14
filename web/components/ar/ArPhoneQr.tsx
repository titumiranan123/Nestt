"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function ArPhoneQr({ path, description = "Scan to open this page. If Nestt AR is installed, a verified app link opens the matching experience." }: { path?: string; description?: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(path ? new URL(path, window.location.origin).toString() : window.location.href);
  }, [path]);

  if (!url) return null;

  return (
    <aside className="mt-8 hidden items-center gap-4 border border-[#e9e5de] bg-[#faf9f6] p-4 md:flex">
      <div className="shrink-0 bg-white p-2"><QRCodeSVG value={url} size={104} level="M" aria-label="QR code to continue in the Nestt app" /></div>
      <div><p className="text-xs font-semibold">Continue on your phone</p><p className="mt-1 text-[11px] leading-5 text-[#706c64]">{description}</p>{new URL(url).hostname === 'localhost' && <p className="mt-1 text-[10px] leading-4 text-[#a2513d]">This local QR works only on this computer. Use a reachable HTTPS website for phone testing.</p>}</div>
    </aside>
  );
}
