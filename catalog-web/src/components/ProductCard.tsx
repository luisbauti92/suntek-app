import { WhatsAppIcon } from './WhatsAppIcon';
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
    <article className="product-card flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition duration-200 hover:border-[var(--border-strong)]">
      <MaterialMedia product={product} />

      <div className="product-card-body flex flex-1 flex-col gap-2.5 p-3.5">
        <div>
          <h3 className="text-base font-semibold leading-snug text-[var(--text-strong)]">
            {product.name}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--text)]">
            {t('product.sku')} · {product.sku}
          </p>
        </div>

        <dl className="product-specs flex flex-wrap items-baseline gap-x-1.5 text-[13px] text-[var(--text)]">
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

        <dl className="product-prices">
          <div><dt className="sr-only">{meters ? t('product.roll') : t('product.unit')}</dt>
            <dd className="main-price">{rollPrice}</dd></div>
          {meterPrice && <div><dt className="sr-only">{t('product.meter')}</dt>
            <dd className="meter-price">{meterPrice}/{t('product.meter')}</dd></div>}
        </dl>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="product-whatsapp">
          <WhatsAppIcon />{t('product.cta')}
        </a>
      </div>
    </article>
  );
}
