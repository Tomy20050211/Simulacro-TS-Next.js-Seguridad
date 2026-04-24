'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
};

export function Modal({
  open,
  title,
  description,
  children,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  onClose,
  onConfirm,
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[1.5rem] border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl shadow-black/60">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          {description ? <p className="text-sm leading-6 text-white/65">{description}</p> : null}
        </div>

        <div className="mt-5">{children}</div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          {onConfirm ? <Button onClick={onConfirm}>{confirmLabel}</Button> : null}
        </div>
      </div>
    </div>
  );
}
