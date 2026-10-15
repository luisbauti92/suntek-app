import { Package, Banknote, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
export function CatalogHero() {
  const { t } = useLanguage();
  return <section className="catalog-hero" aria-labelledby="hero-title">
    <div className="hero-copy"><h1 id="hero-title">{t('hero.titleLine1')}<br />{t('hero.titleLine2')}</h1>
      <p>{t('hero.description')}</p></div>
    <p className="hero-note" aria-hidden="true">{t('hero.noteLine1')}<br />{t('hero.noteLine2')}<br />{t('hero.noteLine3')}</p>
    <ul className="hero-benefits">
      <li><Package aria-hidden /><div><strong>{t('hero.rollTitle')}</strong><span>{t('hero.rollBody')}</span></div></li>
      <li><Banknote aria-hidden /><div><strong>{t('hero.priceTitle')}</strong><span>{t('intro.note')}</span></div></li>
      <li><MessageCircle aria-hidden /><div><strong>{t('footer.contact')}</strong><span>{t('hero.contactBody')}</span></div></li>
    </ul>
  </section>;
}
