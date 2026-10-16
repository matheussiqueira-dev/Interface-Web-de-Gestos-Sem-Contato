"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Destructive confirmation on the native <dialog> (focus trap, Esc and top
 * layer for free). "Cancelar" is the default focus; the browser returns focus
 * to the trigger on close.
 */
export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="ms-dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div className="ms-dialog__head">
        <h2 id="confirm-title">{title}</h2>
        <button type="button" className="ms-btn ms-btn--ghost ms-btn--icon" aria-label="Fechar" onClick={onCancel}>
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <p id="confirm-description" className="ms-dialog__body">
        {description}
      </p>
      <div className="ms-dialog__actions">
        <button ref={cancelRef} type="button" className="ms-btn ms-btn--secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="ms-btn ms-btn--danger-solid" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
