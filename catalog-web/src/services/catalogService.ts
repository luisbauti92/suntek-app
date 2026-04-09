import type { CatalogProduct } from '../types/catalog';

/**
 * Base del API: por defecto `/api` (mismo origen).
 * - En `npm run dev`: Vite hace proxy a `API_PROXY_TARGET` e inyecta `X-Catalog-Key` desde `CATALOG_API_KEY` (solo en Node).
 * - En producción: nginx (u otro) debe servir el SPA y hacer proxy de `/api` → backend con la misma cabecera.
 */
function getApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return '/api';
}

/**
 * Lista pública desde `GET /api/catalog/products`.
 * La clave de catálogo no se envía desde el navegador (opción BFF/proxy).
 */
export async function fetchCatalogProducts(signal?: AbortSignal): Promise<CatalogProduct[]> {
  const url = `${getApiBase()}/catalog/products`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch {
    throw new Error(
      'Sin conexión con el catálogo. ¿Está el API corriendo (p. ej. puerto 5021) y usas `VITE_API_BASE_URL=/api` con el proxy de Vite?'
    );
  }

  if (res.status === 401) {
    throw new Error('Catálogo no autorizado: revisa CATALOG_API_KEY en .env (debe coincidir con Catalog:ApiKey del API).');
  }
  if (res.status === 503) {
    throw new Error('Catálogo no disponible en el servidor (Catalog:ApiKey no configurado en producción).');
  }
  if (res.status === 502 || res.status === 504) {
    throw new Error(
      'El proxy no pudo contactar al API (502/504). Arranca el backend o revisa API_PROXY_TARGET en .env.'
    );
  }
  if (!res.ok) {
    throw new Error(`No se pudo cargar el catálogo (${res.status}).`);
  }

  const data = (await res.json()) as CatalogProduct[];
  return Array.isArray(data) ? data : [];
}
