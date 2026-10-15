import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ImageOff,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  IMAGE_ACCEPT,
  MAX_IMAGE_BYTES,
  productImagesApi,
  type InventoryItemDto,
  type ProductImageDto,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/Button';
import { ConfirmModal } from './ConfirmModal';

interface ProductImagesModalProps {
  item: InventoryItemDto;
  onClose: () => void;
  /** Called after any successful mutation so the catalog list can refresh its thumbnail. */
  onChanged?: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Thumbnail that degrades to a neutral placeholder instead of a broken image icon. */
function Thumbnail({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-300">
        <ImageOff className="h-8 w-8" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-contain"
    />
  );
}

/**
 * Gallery management for one product. The parent mounts this only while open (keyed by product),
 * so every open starts from a clean state and there is no reset-on-open effect.
 */
export function ProductImagesModal({ item, onClose, onChanged }: ProductImagesModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes('Admin'));

  const [images, setImages] = useState<ProductImageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProductImageDto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetId = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const productId = item.id;

  // State changes only happen in promise callbacks, so the effect never sets state synchronously.
  useEffect(() => {
    let cancelled = false;
    productImagesApi
      .list(productId)
      .then((res) => {
        if (cancelled) return;
        setImages(res.data);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, reloadKey]);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }, []);

  const refreshAfterMutation = useCallback(() => {
    reload();
    onChanged?.();
  }, [reload, onChanged]);

  async function uploadFiles(fileList: FileList | File[]) {
    if (!isAdmin) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const accepted: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(t('catalog.images.invalidType', { name: file.name }));
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(t('catalog.images.tooLarge', { name: file.name, size: MAX_MB }));
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length === 0) return;

    setBusy(true);
    let uploaded = 0;
    for (let i = 0; i < accepted.length; i++) {
      setProgress({ current: i + 1, total: accepted.length, percent: 0 });
      try {
        await productImagesApi.upload(productId, accepted[i], (percent) =>
          setProgress({ current: i + 1, total: accepted.length, percent })
        );
        uploaded++;
      } catch {
        toast.error(t('catalog.images.uploadFailed', { name: accepted[i].name }));
      }
    }
    setProgress(null);
    setBusy(false);

    if (uploaded > 0) {
      toast.success(t('catalog.images.uploadSuccess', { count: uploaded }));
      refreshAfterMutation();
    }
  }

  async function handleSetPrimary(image: ProductImageDto) {
    if (image.isPrimary) return;
    const previous = images;
    setImages((prev) => prev.map((i) => ({ ...i, isPrimary: i.id === image.id })));
    setBusy(true);
    try {
      await productImagesApi.setPrimary(productId, image.id);
      toast.success(t('catalog.images.primarySuccess'));
      onChanged?.();
    } catch {
      setImages(previous);
      toast.error(t('catalog.images.primaryFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    const previous = images;
    setImages(next);
    setBusy(true);
    try {
      await productImagesApi.reorder(productId, next.map((i) => i.id));
    } catch {
      setImages(previous);
      toast.error(t('catalog.images.reorderFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setBusy(true);
    try {
      await productImagesApi.remove(productId, target.id);
      toast.success(t('catalog.images.removeSuccess'));
      setPendingDelete(null);
      refreshAfterMutation();
    } catch {
      toast.error(t('catalog.images.removeFailed'));
    } finally {
      setBusy(false);
    }
  }

  function requestReplace(image: ProductImageDto) {
    replaceTargetId.current = image.id;
    replaceInputRef.current?.click();
  }

  async function handleReplaceFile(file: File) {
    const imageId = replaceTargetId.current;
    replaceTargetId.current = null;
    if (imageId == null) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t('catalog.images.invalidType', { name: file.name }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t('catalog.images.tooLarge', { name: file.name, size: MAX_MB }));
      return;
    }

    setBusy(true);
    try {
      await productImagesApi.replace(productId, imageId, file);
      toast.success(t('catalog.images.replaceSuccess'));
      refreshAfterMutation();
    } catch {
      toast.error(t('catalog.images.replaceFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-images-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      >
        <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
            <div className="min-w-0">
              <h2 id="product-images-title" className="text-lg font-semibold text-slate-900">
                {t('catalog.images.title')}
              </h2>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {item.name} · <span className="font-mono text-xs">{item.sku}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!isAdmin && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('catalog.images.readOnly')}
                </span>
              )}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label={t('catalog.images.close')}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <p className="text-xs text-slate-500">{t('catalog.images.subtitle')}</p>

            {isAdmin && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!busy) setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (!busy && e.dataTransfer.files.length > 0) void uploadFiles(e.dataTransfer.files);
                }}
                className={`mt-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-6 text-center transition ${
                  dragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <UploadCloud className={`h-7 w-7 ${dragActive ? 'text-brand-600' : 'text-slate-400'}`} aria-hidden />
                <p className="mt-2 text-sm font-medium text-slate-700">{t('catalog.images.uploadTitle')}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t('catalog.images.uploadHint', { size: MAX_MB })}
                </p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('catalog.images.uploadButton')}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) void uploadFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                {progress && (
                  <div className="mt-3 w-full max-w-sm" aria-live="polite">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        {t('catalog.images.uploading', { current: progress.current, total: progress.total })}
                      </span>
                      <span className="tabular-nums">{progress.percent}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-xl border border-slate-200 px-6 py-10 text-center">
                  <p className="text-sm text-slate-500">{t('catalog.images.loadError')}</p>
                  <Button variant="secondary" className="mt-3" onClick={reload}>
                    {t('dashboard.retry')}
                  </Button>
                </div>
              ) : images.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
                  <ImageOff className="mx-auto h-9 w-9 text-slate-300" aria-hidden />
                  <p className="mt-3 text-sm font-medium text-slate-700">{t('catalog.images.empty')}</p>
                  <p className="mt-1 text-xs text-slate-500">{t('catalog.images.emptyHint')}</p>
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <li
                      key={image.id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="relative aspect-[4/3] bg-slate-50">
                        <Thumbnail url={image.url} alt={image.originalFileName ?? item.name} />
                        {image.isPrimary && (
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                            <Star className="h-3 w-3 fill-current" aria-hidden />
                            {t('catalog.images.primaryBadge')}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 p-2.5">
                        <p className="truncate text-[11px] text-slate-500">
                          {image.originalFileName ?? image.objectKey.split('/').pop()}
                        </p>
                        <p className="text-[11px] tabular-nums text-slate-400">{formatSize(image.fileSizeBytes)}</p>
                        {isAdmin && (
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              disabled={busy || image.isPrimary}
                              onClick={() => void handleSetPrimary(image)}
                              title={t('catalog.images.setPrimary')}
                              aria-label={t('catalog.images.setPrimary')}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Star className="h-4 w-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              disabled={busy || index === 0}
                              onClick={() => void move(index, -1)}
                              title={t('catalog.images.moveLeft')}
                              aria-label={t('catalog.images.moveLeft')}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ArrowLeft className="h-4 w-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              disabled={busy || index === images.length - 1}
                              onClick={() => void move(index, 1)}
                              title={t('catalog.images.moveRight')}
                              aria-label={t('catalog.images.moveRight')}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ArrowRight className="h-4 w-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => requestReplace(image)}
                              title={t('catalog.images.replace')}
                              aria-label={t('catalog.images.replace')}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <RefreshCw className="h-4 w-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setPendingDelete(image)}
                              title={t('catalog.images.remove')}
                              aria-label={t('catalog.images.remove')}
                              className="ml-auto rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isAdmin && (
              <input
                ref={replaceInputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void handleReplaceFile(file);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        title={t('catalog.images.removeTitle')}
        message={t('catalog.images.removeMessage')}
        confirmLabel={t('catalog.images.remove')}
        isLoading={busy}
      />
    </>
  );
}
