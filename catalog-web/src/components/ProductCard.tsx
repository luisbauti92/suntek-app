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
 * A product as a compact specification block.
 *
 * Name and price are the scanning anchors; the WhatsApp action is deliberately subordinate
 * (text + icon, auto width, no filled surface) so a long catalog does not turn into repeated
 * solid bands. Every piece of information appears exactly once, and the card keeps its natural
 * height so rows never force the actions onto a shared baseline.
 *
 * All unit-dependent wording keys off the structured `unitType` field: rolls are measured and
 * priced by the meter, units are not — so unit-based products show no dimensions, no per-meter
 * price, and a "Unit" price label instead of "Roll".
 */
export function ProductCard({ product }: ProductCardProps) {
  const { t } = useLanguage();

  const meters = isMeters(product);
  const hasDimensions = product.width > 0 && product.length > 0;
  const rollPrice = product.pricePerRoll > 0 ? formatBob(product.pricePerRoll) : '—';
  const meterPrice =
    meters && product.pricePerMeter > 0 ? formatBob(product.pricePerMeter) : null;

  const waUrl = buildWhatsAppUrl(
    t('whatsapp.productMessage', { name: product.name, sku: product.sku })
  );

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition duration-200 hover:border-[var(--border-strong)]">
      <MaterialMedia product={product} />

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div>
          <h3 className="text-base font-semibold leading-snug text-[var(--text-strong)]">
            {product.name}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--text)]">
            {t('product.sku')} · {product.sku}
          </p>
        </div>

        <dl className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] text-[var(--text)]">
          {meters ? (
            <>
              <dt className="sr-only">{t('product.width')}</dt>
              <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
                {hasDimensions ? `${formatNumber(product.width)} m` : '—'}
              </dd>
              <span aria-hidden className="opacity-40">
                ×
              </span>
              <dt className="sr-only">{t('product.length')}</dt>
              <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
                {hasDimensions ? `${formatNumber(product.length)} m` : '—'}
              </dd>
              <span aria-hidden className="opacity-40">
                ·
              </span>
              <dt className="sr-only">{t('product.unit')}</dt>
              <dd>{t('product.unitMeters')}</dd>
            </>
          ) : (
            <>
              <dt className="sr-only">{t('product.unit')}</dt>
              <dd>{t('product.unitUnits')}</dd>
            </>
          )}
        </dl>

        <dl className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-[var(--border)] pt-2.5">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <dt className="text-xs text-[var(--text)]">
              {meters ? t('product.roll') : t('product.unit')}
            </dt>
            <dd className="text-xl font-bold tabular-nums text-[var(--text-strong)]">
              {rollPrice}
            </dd>
            {meterPrice && (
              <span className="text-xs text-[var(--text)]">
                · {meterPrice}/{t('product.meter')}
              </span>
            )}
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-[var(--primary)] underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('product.cta')}
          </a>
        </dl>
      </div>
    </article>
  );
}
