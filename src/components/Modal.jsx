import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Popup shell: dark backdrop, closes on Escape or a click outside.
export default function Modal({ onClose, labelledBy, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-eeze-deep-navy/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="pop-in w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl outline-none"
      >
        {children}
      </div>
    </div>
  );
}

export function CloseButton({ onClick, color }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition hover:scale-105"
      style={{ color }}
    >
      <X size={18} />
    </button>
  );
}
