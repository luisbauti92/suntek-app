interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-slate-600">{message}</p>
        </div>
        <div className="px-6 py-4 flex gap-3 justify-end bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition"
          >
            {isLoading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
