/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL del API (sin barra final).
   * Desarrollo recomendado: `/api` (proxy Vite → backend).
   * Producción con BFF/nginx: también `/api` si el host hace proxy al API.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
