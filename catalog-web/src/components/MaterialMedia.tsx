import { useState } from 'react';
import { useLanguage } from '../contexts/useLanguage';
import type { CatalogProduct } from '../types/catalog';
interface MaterialMediaProps { product: CatalogProduct; }
/** Editorial images are never used here. Missing or broken product photos use a neutral placeholder. */
export function MaterialMedia({ product }: MaterialMediaProps) {
  const { t } = useLanguage();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = product.imageUrl?.trim() ?? '';
  const hasPhoto = Boolean(src) && failedSrc !== src;
  return <div className={`product-media${hasPhoto ? '' : ' is-placeholder'}`}>
    {hasPhoto ? <img src={src} alt={t('product.mediaAlt', { name:product.name, sku:product.sku })}
      loading="lazy" decoding="async" onError={() => setFailedSrc(src)} /> : <>
      <img src={product.category === 'films' ? '/placeholders/roll.svg' : '/placeholders/box.svg'} alt="" aria-hidden="true" />
      <span>{t('product.photoMissing')}</span>
    </>}
  </div>;
}
