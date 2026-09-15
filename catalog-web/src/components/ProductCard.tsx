import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import type { CatalogProduct } from '../types/catalog';
import { formatBob, formatNumber } from '../utils/money';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { MaterialMedia } from './MaterialMedia';

interface ProductCardProps {
  product: CatalogProduct;
}

function isMeters(product: CatalogProduct): boolean {
  return product.unitType === 'Meters' || product.unitType === 0;
}

/**
 * A product as a compact specification block: name first, then SKU, roll dimensions, prices
 * and the WhatsApp action, separated by thin rules. When the product has real photography,
 * MaterialMedia adds the image above and the same block sits beneath it. Each piece of
 * information appears exactly once.
 */
export function ProductCard({ product }: ProductCardProps) {
  const { t } = useLanguage();

  const meters = isMeters(product);
  const hasDimensions = product.width > 0 && product.length > 0;
  const rollPrice = product.pricePerRoll > 0 ? formatBob(product.pricePerRoll) : '—';
  const meterPrice = meters && product.pricePerMeter > 0 ? formatBob(product.pricePerMeter) : '—';

  const waUrl = buildWhatsAppUrl(
    t('whatsapp.productMessage', { name: product.name, sku: product.sku })
  );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition duration-200 hover:border-[var(--border-strong)]">
      <MaterialMedia product={product} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-lg font-semibold leading-snug text-[var(--text-strong)]">
            {product.name}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--text)]">
            {t('product.sku')} · {product.sku}
          </p>
        </div>

        <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--text)]">
          <div className="flex items-baseline gap-1">
            <dt>{t('product.width')}</dt>
            <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
              {hasDimensions ? `${formatNumber(product.width)} m` : '—'}
            </dd>
          </div>
          <div className="flex items-baseline gap-1">
            <dt>{t('product.length')}</dt>
            <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
              {hasDimensions ? `${formatNumber(product.length)} m` : '—'}
            </dd>
          </div>
          <div className="flex items-baseline gap-1">
            <dt>{t('product.unit')}</dt>
            <dd className="font-semibold text-[var(--text-strong)]">
              {meters ? t('product.unitMeters') : t('product.unitUnits')}
            </dd>
          </div>
        </dl>

        <dl className="flex items-baseline justify-between gap-4 border-t border-[var(--border)] pt-3">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-xs text-[var(--text)]">{t('product.roll')}</dt>
            <dd className="text-sm font-bold tabular-nums text-[var(--text-strong)]">
              {rollPrice}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-xs text-[var(--text)]">{t('product.meter')}</dt>
            <dd className="text-sm font-bold tabular-nums text-[var(--text-strong)]">
              {meterPrice}
            </dd>
          </div>
        </dl>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          {t('product.cta')}
        </a>
      </div>
    </article>
  );
}
