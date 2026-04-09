import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import type { CatalogProduct } from '../types/catalog';
import { BrandedProductImagePlaceholder } from './BrandedProductImagePlaceholder';
import { formatBob } from '../utils/money';
import { buildCatalogWhatsAppUrl } from '../utils/whatsapp';

function isInStock(p: CatalogProduct): boolean {
  return p.wholesaleQuantity > 0 || p.retailQuantity > 0;
}

function isMeters(p: CatalogProduct): boolean {
  return p.unitType === 'Meters' || p.unitType === 0;
}

interface ProductCardProps {
  product: CatalogProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const inStock = isInStock(product);
  const meters = isMeters(product);
  const waUrl = buildCatalogWhatsAppUrl(product.name, product.sku);

  const trimmedUrl = product.imageUrl?.trim() ?? '';
  const showPhoto = trimmedUrl.length > 0 && !imgFailed;

  const specBadges: { key: string; label: string }[] = [];
  if (meters && product.width > 0) {
    specBadges.push({ key: 'w', label: `Ancho: ${product.width}m` });
  }
  if (meters && product.length > 0) {
    specBadges.push({ key: 'l', label: `Largo: ${product.length}m` });
  }
  if (product.milThickness) specBadges.push({ key: 'mil', label: product.milThickness });
  if (product.uvProtection) specBadges.push({ key: 'uv', label: product.uvProtection });
  specBadges.push({
    key: 'u',
    label: meters ? 'Unidad: metros' : 'Unidad: uds.',
  });

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm transition duration-200 hover:border-[var(--secondary)] hover:shadow-[0_8px_30px_rgba(0,157,223,0.18)]"
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[var(--surface-muted)]">
        {showPhoto ? (
          <img
            src={trimmedUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <BrandedProductImagePlaceholder />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
        <span
          className={`absolute right-2 top-2 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
            inStock
              ? 'border border-[var(--secondary)]/50 bg-white/95 text-[var(--primary)] shadow-sm'
              : 'border border-[var(--border)] bg-white/90 text-slate-600'
          }`}
        >
          {inStock ? 'En stock' : 'Agotado'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 text-left">
        <div>
          <h2 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--text-h)]">
            {product.name}
          </h2>
          <p className="mt-1 font-mono text-xs text-[var(--secondary)]">SKU · {product.sku}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {specBadges.map((b) => (
            <span
              key={b.key + b.label}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text)]"
            >
              {b.label}
            </span>
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--text)]">
          <div className="col-span-2 flex justify-between">
            <dt>Cant.</dt>
            <dd className="font-semibold text-[var(--text-h)]">{product.quantity}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="opacity-80">Rollo</dt>
            <dd className="font-semibold text-slate-800">
              {product.pricePerRoll > 0 ? formatBob(product.pricePerRoll) : '—'}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <dt className="opacity-80">Metro</dt>
            <dd className="font-semibold text-slate-800">
              {meters && product.pricePerMeter > 0 ? formatBob(product.pricePerMeter) : '—'}
            </dd>
          </div>
        </dl>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          Consultar WhatsApp
        </a>
      </div>
    </article>
  );
}
