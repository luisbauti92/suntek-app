import type { CatalogProduct } from '../types/catalog';

/**
 * Base del API: por defecto `/api` (mismo origen).
 * - En dev: Vite hace proxy a `API_PROXY_TARGET` e inyecta `X-Catalog-Key` desde `CATALOG_API_KEY` (solo en Node).
 * - En producción: nginx (u otro) sirve el SPA y hace proxy de `/api` → backend con la misma cabecera.
 */
function getApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return '/api';
}

/**
 * Lista pública desde `GET /api/catalog/products`.
 * La clave de catálogo no se envía desde el navegador (opción BFF/proxy).
 *
 * Los mensajes de error son técnicos, para diagnóstico: el copy que ve el usuario lo
 * provee la capa de i18n a partir del estado de error del hook.
 */
export async function fetchCatalogProducts(signal?: AbortSignal): Promise<CatalogProduct[]> {
  const url = `${getApiBase()}/catalog/products`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Catalog request failed with status ${res.status}`);
  }

  const data = (await res.json()) as CatalogProduct[];
  return Array.isArray(data) ? data : [];
}
