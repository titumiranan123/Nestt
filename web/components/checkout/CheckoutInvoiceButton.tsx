"use client";

import { useRef, useState } from "react";
import { downloadOrderInvoice } from "@/lib/account/download-invoice";

export function CheckoutInvoiceButton({ orderId, orderCode, className }: {
  orderId: string;
  orderCode: string;
  className: string;
}) {
  const downloading = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    if (downloading.current) return;
    downloading.current = true;
    setBusy(true);
    setError("");
    try {
      await downloadOrderInvoice(orderId, orderCode);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Couldn’t download the invoice.");
    } finally {
      downloading.current = false;
      setBusy(false);
    }
  }

  return <div>
    <button type="button" className={className} onClick={() => void download()} disabled={busy}>
      {busy ? "Downloading…" : "Download invoice"}
    </button>
    {error && <p role="alert" className="mt-2 text-sm text-[#a04433]">{error}</p>}
  </div>;
}
