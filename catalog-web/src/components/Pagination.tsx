import { useLanguage } from '../contexts/useLanguage';
import { getPageItems } from '../utils/pagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const arrowClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-strong)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]';

const pageClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]';

/**
 * Client-side pager.
 *
 * Desktop/tablet: Previous | 1 … 7 8 9 … 15 | Next.
 * Mobile: Previous | Page X of Y | Next — no individual page-number buttons, so the row never
 * overflows a narrow viewport.
 */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { t } = useLanguage();
  const items = getPageItems(currentPage, totalPages);

  return (
    <nav aria-label={t('pagination.label')} className="mt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={arrowClass}
      >
        {t('pagination.previous')}
      </button>

      <ul className="hidden items-center gap-1 sm:flex">
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <li key={`ellipsis-${index}`} aria-hidden className="px-1 text-sm text-[var(--text)]">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? 'page' : undefined}
                aria-label={t('pagination.goToPage', { n: item })}
                className={
                  item === currentPage
                    ? `${pageClass} bg-[var(--primary)] text-white`
                    : `${pageClass} text-[var(--text-strong)] hover:bg-[var(--surface-muted)]`
                }
              >
                {item}
              </button>
            </li>
          )
        )}
      </ul>

      <p className="text-sm font-medium text-[var(--text)] sm:hidden">
        {t('pagination.page', { current: currentPage, total: totalPages })}
      </p>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={arrowClass}
      >
        {t('pagination.next')}
      </button>
    </nav>
  );
}
