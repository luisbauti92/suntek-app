import { useState } from 'react';
import { useLanguage } from '../contexts/useLanguage';
import type { CatalogProduct } from '../types/catalog';

interface MaterialMediaProps {
  product: CatalogProduct;
}

/**
 * Media area for a product.
 *
 * With real photography (`imageUrl` present) the image occupies the media area and becomes
 * the visual hero. With no photograph, the media area is not rendered at all: the card falls
 * back to a compact typographic specification block instead of reserving an empty surface.
 * The same applies if a provided image fails to load.
 */
export function MaterialMedia({ product }: MaterialMediaProps) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);

  const src = product.imageUrl?.trim() ?? '';
  if (src.length === 0 || failed) return null;

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-muted)]">
      <img
        src={src}
        alt={t('product.mediaAlt', { name: product.name, sku: product.sku })}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
