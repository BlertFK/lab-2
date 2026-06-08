import { useEffect } from "react";
import { clsx } from "clsx";
import { X } from "lucide-react";
import Button from "./Button";

/** Generic modal dialog */
export function Modal({ isOpen, onClose, title, children, size = "md", className }) {
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="uis-modal-overlay" onClick={onClose}>
      <div
        className={clsx("uis-modal", `uis-modal--${size}`, className)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="uis-modal__header">
          {title && <h2 id="modal-title" className="uis-modal__title">{title}</h2>}
          <button className="uis-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="uis-modal__body">{children}</div>
      </div>
    </div>
  );
}

/** Confirm / delete dialog */
export function ConfirmDialog({ isOpen, onConfirm, onClose, title, message, danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p style={{ marginBottom: "24px", color: "var(--text-muted)" }}>{message}</p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>Confirm</Button>
      </div>
    </Modal>
  );
}
