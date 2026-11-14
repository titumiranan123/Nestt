"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function AdminDrawer({
  open,
  title,
  description,
  widthClassName = "max-w-xl",
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  widthClassName?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    const closeTimer = window.setTimeout(() => setMounted(false), 340);
    return () => window.clearTimeout(closeTimer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="admin-action-scope fixed inset-0 z-[120] flex justify-end" style={{ pointerEvents: open ? "auto" : "none" }}>
      <button
        type="button"
        aria-label="Close drawer"
        tabIndex={open ? 0 : -1}
        className="absolute inset-0 bg-gray-950/35 backdrop-blur-[2px] transition-opacity duration-300 ease-out motion-reduce:transition-none"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-drawer-title"
        aria-hidden={!open}
        inert={!open}
        className={`relative flex h-full w-full ${widthClassName} flex-col border-l border-brand/15 bg-white shadow-2xl will-change-transform transition-[transform,opacity] duration-[340ms] ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none`}
        style={{ transform: visible ? "translateX(0)" : "translateX(100%)", opacity: visible ? 1 : 0 }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-6">
          <div>
            <h2 id="admin-drawer-title" className="text-lg font-bold tracking-tight text-gray-950">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"><X size={18} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
