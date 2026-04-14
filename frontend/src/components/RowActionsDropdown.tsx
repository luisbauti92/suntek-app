import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, MoreHorizontal, Pencil, Plus } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface WarehouseRowActionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onAddStock: () => void;
  onOpenBox: () => void;
  openBoxDisabled: boolean;
  labels: { more: string; edit: string; addStock: string; openBox: string };
}

export function WarehouseRowActionsDropdown({
  open,
  onOpenChange,
  onEdit,
  onAddStock,
  onOpenBox,
  openBoxDisabled,
  labels,
}: WarehouseRowActionsProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const w = 192;
    setPos({
      top: r.bottom + 6,
      left: Math.min(r.right - w, window.innerWidth - w - 8),
    });
  }, [open]);

  useClickOutside(menuRef, () => onOpenChange(false), open, [btnRef]);

  return (
    <div className="relative flex justify-end">
      <button
        ref={btnRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="menu"
        title={labels.more}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
            style={{ top: pos.top, left: pos.left }}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
            >
              <Pencil className="h-4 w-4 text-slate-400" />
              {labels.edit}
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                onOpenChange(false);
                onAddStock();
              }}
            >
              <Plus className="h-4 w-4 text-emerald-600" />
              {labels.addStock}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={openBoxDisabled}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => {
                if (openBoxDisabled) return;
                onOpenChange(false);
                onOpenBox();
              }}
            >
              <Box className="h-4 w-4 text-violet-600" />
              {labels.openBox}
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

interface StorefrontRowActionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  labels: { more: string; edit: string };
}

export function StorefrontRowActionsDropdown({
  open,
  onOpenChange,
  onEdit,
  labels,
}: StorefrontRowActionsProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const w = 160;
    setPos({
      top: r.bottom + 6,
      left: Math.min(r.right - w, window.innerWidth - w - 8),
    });
  }, [open]);

  useClickOutside(menuRef, () => onOpenChange(false), open, [btnRef]);

  return (
    <div className="relative flex justify-end">
      <button
        ref={btnRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        aria-expanded={open}
        title={labels.more}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
            style={{ top: pos.top, left: pos.left }}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
            >
              <Pencil className="h-4 w-4 text-slate-400" />
              {labels.edit}
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
