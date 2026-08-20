import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// Selector for elements that can receive keyboard focus
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Element that had focus before the modal opened — we return focus here on close
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Remember what was focused before opening, so we can restore it
    triggerElementRef.current = document.activeElement as HTMLElement;

    // Move focus into the dialog — first focusable element, or the dialog itself
    const focusablesOnOpen = dialogRef.current?.querySelectorAll<HTMLElement>(
      FOCUSABLE_SELECTOR
    );
    if (focusablesOnOpen && focusablesOnOpen.length > 0) {
      focusablesOnOpen[0].focus();
    } else {
      dialogRef.current?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR
        );
        if (!focusables || focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        // Trap focus: wrap from last -> first, and first -> last
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Return focus to whatever triggered the modal
      triggerElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        // Stop clicks inside the dialog from bubbling to the overlay and closing it
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">{title}</h2>
        {children}
        <button type="button" onClick={onClose} className="modal-close">
          Close
        </button>
      </div>
    </div>
  );
}