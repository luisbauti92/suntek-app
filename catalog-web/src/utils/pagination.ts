export const PAGE_SIZE = 24;

export function pageCount(totalItems: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export type PageItem = number | 'ellipsis';

/**
 * Desktop pager items: first + last + a window around the current page, with an ellipsis
 * wherever there is a gap. Never returns a long sequence (7 items max for window 1).
 */
export function getPageItems(current: number, total: number, window = 1): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const keep = new Set<number>([1, total]);
  for (let page = current - window; page <= current + window; page += 1) {
    if (page >= 1 && page <= total) keep.add(page);
  }

  const sorted = [...keep].sort((a, b) => a - b);
  const items: PageItem[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) items.push('ellipsis');
    items.push(page);
    previous = page;
  }
  return items;
}
