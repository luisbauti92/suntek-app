import { ArrowRight, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import { CATEGORIES, type CatalogCategory } from '../types/catalog';
interface CategoryRailProps {
  available: CatalogCategory[];
  selected: Set<CatalogCategory>;
  onToggle: (category: CatalogCategory) => void;
  onSelectAll: () => void;
  variant?: 'editorial' | 'filters';
}
const images: Record<CatalogCategory,string> = { films:'/editorial/peliculas.webp', tools:'/editorial/herramientas.webp', accessories:'/editorial/accesorios.webp', materials:'/editorial/materials.webp' };
export function CategoryRail({ available, selected, onToggle, onSelectAll, variant = 'editorial' }: CategoryRailProps) {
  const { t } = useLanguage();
  if (variant === 'filters') return <fieldset className="category-filter">
    <legend>{t('categories.title')}<ChevronDown size={14} aria-hidden /></legend>
    <button type="button" aria-pressed={selected.size === 0} onClick={onSelectAll}><span className="filter-check" aria-hidden />{t('categories.all')}</button>
    {available.map(category => <button key={category} type="button" aria-pressed={selected.has(category)} onClick={() => onToggle(category)}>
      <span className="filter-check" aria-hidden />{t(`categories.${category}`)}
    </button>)}
  </fieldset>;
  return <nav id="materials" className="catalog-categories" aria-label={t('categories.browse')}>
    {CATEGORIES.map(category => <button key={category} type="button" className="category-card"
      aria-pressed={selected.has(category)} onClick={() => onToggle(category)}>
      <img src={images[category]} alt="" width="768" height="512" loading="lazy" decoding="async" />
      <div><strong>{t(`categories.${category}`)}</strong><span>{t(`categoryDescriptions.${category}`)}</span>
        <small>{t('categories.explore')}<ArrowRight size={13} aria-hidden /></small></div>
    </button>)}
  </nav>;
}
