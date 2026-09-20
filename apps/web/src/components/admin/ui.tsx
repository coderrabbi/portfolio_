'use client';
import { useEffect, useRef, useId } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
export function PageTitle({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-page-title">
      <div>
        <span className="eyebrow">PORTFOLIO STUDIO</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`admin-modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ConfirmDialog({
  title,
  description,
  onCancel,
  onConfirm,
  busy = false,
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{description}</p>
      <div className="modal-actions">
        <button type="button" className="admin-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="admin-button danger" disabled={busy} onClick={onConfirm}>
          {busy ? 'Deleting…' : 'Delete permanently'}
        </button>
      </div>
    </Modal>
  );
}
export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        Page {page} of {Math.max(1, pages)}
      </span>
      <button aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={18} />
      </button>
      <button aria-label="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
export function Loading() {
  return (
    <div className="admin-loading" aria-label="Loading">
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="admin-error" role="alert">
      <p>{message}</p>
      {retry && (
        <button className="admin-button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="admin-empty">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
