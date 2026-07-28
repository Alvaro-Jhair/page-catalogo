"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Resalta el botón de confirmar en rojo — para acciones destructivas (borrar, descartar). */
  danger?: boolean;
};

type PendingConfirm = ConfirmOptions & { resolve: (value: boolean) => void };

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Reemplaza `window.confirm()` (usado hasta la Fase D en BlockList,
 * CatalogList y el wizard) por un diálogo propio, consistente con el
 * resto del panel en vez de la caja nativa del navegador — mismo
 * espíritu de "confirmaciones elegantes" que el resto de este batch.
 * API imperativa (`await confirm(...)`) en vez de un componente
 * <ConfirmDialog> controlado en cada lugar que lo usa, para que
 * reemplazar un `if (!confirm(...)) return;` sea un cambio de una
 * línea, no una reestructuración de cada llamador.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts = typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  const resolvePending = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    dialogRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") resolvePending(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pending, resolvePending]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div className="admin-confirm-backdrop" onClick={() => resolvePending(false)}>
          <div
            className="admin-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-label={pending.title ?? "Confirmar"}
            ref={dialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            {pending.title && <p className="admin-confirm-title">{pending.title}</p>}
            <p className="admin-confirm-message">{pending.message}</p>
            <div className="admin-confirm-actions">
              <button type="button" className="admin-btn" onClick={() => resolvePending(false)}>
                {pending.cancelLabel ?? "Cancelar"}
              </button>
              <button
                type="button"
                className={`admin-btn admin-btn-primary${pending.danger ? " admin-btn-danger-solid" : ""}`}
                onClick={() => resolvePending(true)}
              >
                {pending.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (options: ConfirmOptions | string) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  }
  return ctx.confirm;
}
