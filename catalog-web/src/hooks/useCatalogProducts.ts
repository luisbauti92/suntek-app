import { useEffect, useState } from 'react';
import { fetchCatalogProducts } from '../services/catalogService';
import type { CatalogProduct } from '../types/catalog';

export function useCatalogProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetchCatalogProducts(ac.signal)
      .then((data) => {
        if (ac.signal.aborted) return;
        setProducts(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (ac.signal.aborted) return;
        setError('No se pudo cargar el catálogo. Intenta de nuevo más tarde.');
        setProducts([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, []);

  return { products, loading, error };
}
