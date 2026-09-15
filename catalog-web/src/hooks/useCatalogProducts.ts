import { useEffect, useState } from 'react';
import { fetchCatalogProducts } from '../services/catalogService';
import type { CatalogProduct } from '../types/catalog';

export function useCatalogProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ac = new AbortController();

    fetchCatalogProducts(ac.signal)
      .then((data) => {
        if (ac.signal.aborted) return;
        setProducts(data);
        setError(false);
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setProducts([]);
        setError(true);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, []);

  return { products, loading, error };
}
