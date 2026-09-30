"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the user closes the modal (Escape, backdrop click, × button) */
  onClose: () => void;
  /** Optional title rendered in the modal header */
  title?: string;
  /** Controls the max-width of the modal panel */
  size?: "sm" | "md" | "lg";
  /** Modal body content */
  children: React.ReactNode;
  /** Hides the × close button when true */
  hideCloseButton?: boolean;
  /** Optional additional classes for dialog panel */
  className?: string;
  /** Optional additional classes for modal body container */
  bodyClassName?: string;
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

/**
 * Modal
 * ──────────────────────────────────────────────────────────────
 * Built on the native <dialog> element for:
 *   • Escape key closure (browser-native)
 *   • Focus trapping (browser-native)
 *   • Proper stacking context (::backdrop)
 *   • Accessibility: role=dialog, aria-modal, aria-labelledby
 *
 * Usage (P2-01 — Sprint 3):
 *   <Modal isOpen={open} onClose={() => setOpen(false)} title="عنوان النافذة">
 *     <p>محتوى النافذة</p>
 *   </Modal>
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
  hideCloseButton = false,
  className,
  bodyClassName,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync open/close state with the native <dialog> API
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  // Map the native "cancel" event (Escape key) → onClose
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault(); // Prevent native close; we control it
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  // Close when clicking the ::backdrop (outside the panel)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (clickedOutside) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      className={cn(
        // Reset browser default dialog styles & eliminate default browser scrollbar
        "m-auto rounded-3xl border border-gray-100 bg-white p-0 shadow-2xl overflow-hidden",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        // Entrance animation
        "open:animate-in open:fade-in open:zoom-in-95 open:duration-200",
        // Cap height — flex is on the inner div, NOT here (flex on dialog breaks m-auto centering)
        "w-full max-h-[92vh]",
        sizeMap[size],
        className
      )}
    >
      {/* Panel content — flex column so header is sticky, body scrolls if necessary */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header — pinned, never scrolls */}
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4 sm:py-5 shrink-0">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-bold text-gray-900 truncate"
              >
                {title}
              </h2>
            )}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="mr-auto text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl p-1.5 transition-colors flex-shrink-0 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body — scrolls gracefully via scrollbar-hide without displaying ugly desktop scrollbar */}
        <div className={cn("px-6 py-5 overflow-y-auto scrollbar-hide flex-1", bodyClassName)}>
          {children}
        </div>
      </div>
    </dialog>
  );
}
