import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { CATEGORY_LABELS, type CatalogCategory, type CatalogProduct } from '../types/catalog';
import { catalogListPrice, uniqueBrands } from '../utils/catalogFilters';
import { formatBob } from '../utils/money';

const CATEGORIES: CatalogCategory[] = ['films', 'tools', 'accessories'];

interface FilterSidebarProps {
  allProducts: CatalogProduct[];
  selectedCategories: Set<CatalogCategory>;
  onToggleCategory: (c: CatalogCategory) => void;
  selectedBrands: Set<string>;
  onToggleBrand: (b: string) => void;
  priceMin: number | null;
  priceMax: number | null;
  onPriceMinChange: (v: number | null) => void;
  onPriceMaxChange: (v: number | null) => void;
  onClearFilters: () => void;
}

function AccordionSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="border-b border-[var(--border)] py-1 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm font-semibold text-[var(--text-h)] transition hover:text-[var(--secondary)]"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text)] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && <div className="pb-4 pt-0">{children}</div>}
    </div>
  );
}

export function FilterSidebar({
  allProducts,
  selectedCategories,
  onToggleCategory,
  selectedBrands,
  onToggleBrand,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  onClearFilters,
}: FilterSidebarProps) {
  const brands = uniqueBrands(allProducts);
  const prices = allProducts.map(catalogListPrice).filter((n) => n > 0);
  const maxCatalog = prices.length ? Math.ceil(Math.max(...prices)) : 10000;

  const hasFilters =
    selectedCategories.size > 0 ||
    selectedBrands.size > 0 ||
    priceMin != null ||
    priceMax != null;

  return (
    <aside
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
      aria-label="Filtros"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-h)]">Filtros</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs font-semibold text-[var(--secondary)] hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>

      <AccordionSection title="Categorías" defaultOpen>
        <ul className="flex flex-col gap-2">
          {CATEGORIES.map((c) => {
            const checked = selectedCategories.has(c);
            return (
              <li key={c}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-[var(--secondary-soft)]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCategory(c)}
                    className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--secondary)]"
                  />
                  <span className="text-sm text-[var(--text)]">{CATEGORY_LABELS[c]}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-[var(--text)] opacity-75">
          Sin marcar ninguna: se muestran todas las categorías.
        </p>
      </AccordionSection>

      <AccordionSection title="Precio (BOB)" defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text)]">Mín.</span>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={priceMin ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onPriceMinChange(v === '' ? null : Number(v));
              }}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/30"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text)]">Máx.</span>
            <input
              type="number"
              min={0}
              step={1}
              placeholder={String(maxCatalog)}
              value={priceMax ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onPriceMaxChange(v === '' ? null : Number(v));
              }}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/30"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-[var(--text)] opacity-75">
          Usa precio por rollo o, si no aplica, por metro. Hasta ~{formatBob(maxCatalog)}.
        </p>
      </AccordionSection>

      <AccordionSection title="Marca" defaultOpen>
        <ul className="custom-scrollbar max-h-48 flex flex-col gap-2 overflow-y-auto pr-1">
          {brands.map((b) => {
            const checked = selectedBrands.has(b);
            return (
              <li key={b}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-[var(--secondary-soft)]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleBrand(b)}
                    className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--secondary)]"
                  />
                  <span className="truncate text-sm text-[var(--text)]">{b}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </AccordionSection>
    </aside>
  );
}
