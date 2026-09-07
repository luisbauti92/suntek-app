import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ShoppingBag, X, LogOut, Wifi, WifiOff, Loader2 } from 'lucide-react';
import type { ProductDto, CartItem, AuthUser, BatchSaleResponse } from './types';
import { inventoryApi, authApi } from './api/client';
import { ProductCard } from './components/ProductCard';
import { UnitSelectionModal } from './components/UnitSelectionModal';
import { CartCheckoutModal } from './components/CartCheckoutModal';
import { DailyClosureView } from './components/DailyClosureView';
import { LoginModal } from './components/LoginModal';
import { formatBs } from './utils/formatBs';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authApi.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'sales' | 'closure'>('sales');

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Polarizados' | 'Vinilos' | 'Accesorios'>('all');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeProductForModal, setActiveProductForModal] = useState<ProductDto | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auth listener
  useEffect(() => {
    function handleAuthChange() {
      setCurrentUser(authApi.getCurrentUser());
    }
    window.addEventListener('suntek_pos_auth_change', handleAuthChange);
    return () => window.removeEventListener('suntek_pos_auth_change', handleAuthChange);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadProducts = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const list = await inventoryApi.list();
      setProducts(list);
    } catch {
      /* ignore or handle offline */
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadProducts();
    }
  }, [currentUser, loadProducts]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  function handleAddToCart(item: CartItem) {
    setCart((prev) => [...prev, item]);
    showToast(`+ Añadido al ticket`);
  }

  function handleRemoveItem(cartId: string) {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  }

  function handleSaleCompleted(res: BatchSaleResponse) {
    showToast(`✓ Ticket ${res.ticketCode || ''} registrado con éxito (${formatBs(res.totalAmount)})`);
    loadProducts();
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (selectedCategory === 'all') return true;

      const isMeters = p.unitType === 'Meters' || p.unitType === 0;
      const isAccessory = !isMeters && p.rollsPerBox <= 1;

      if (selectedCategory === 'Accesorios') return isAccessory;

      const lower = p.name.toLowerCase();
      if (selectedCategory === 'Polarizados') {
        return (
          lower.includes('readpower') ||
          lower.includes('rayban') ||
          lower.includes('nano') ||
          lower.includes('polar')
        );
      }
      if (selectedCategory === 'Vinilos') {
        return (
          !isAccessory &&
          (lower.includes('vinil') ||
            lower.includes('fibra') ||
            lower.includes('reflect') ||
            lower.includes('mate') ||
            lower.includes('brillo') ||
            lower.includes('color') ||
            lower.includes('negro') ||
            lower.includes('blanco'))
        );
      }
      return true;
    });
  }, [products, searchQuery, selectedCategory]);

  const cartTotal = cart.reduce((acc, i) => acc + i.subtotal, 0);

  if (!currentUser) {
    return <LoginModal onSuccess={setCurrentUser} />;
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white max-w-md mx-auto shadow-2xl relative select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center justify-between animate-in slide-in-from-top duration-200">
          <span>{toastMessage}</span>
          <span className="text-emerald-200 text-sm">✓</span>
        </div>
      )}

      {/* App Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 pt-safe pb-3 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center font-black text-xs tracking-wider shadow-md shadow-violet-600/30">
            ST
          </div>
          <div>
            <div className="text-xs font-black tracking-wide text-white">
              SUNTEK <span className="text-violet-400">POS</span>
            </div>
            <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">
              {currentUser.email.split('@')[0]}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400">Offline</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={authApi.logout}
            className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-zinc-900/90 px-3 py-1.5 flex gap-1 border-b border-zinc-800/80 shrink-0 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex-1 py-2 font-bold rounded-xl transition text-center ${
            activeTab === 'sales'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          🛒 Nueva Venta
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('closure')}
          className={`flex-1 py-2 font-bold rounded-xl transition text-center ${
            activeTab === 'closure'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          📊 Arqueo de Hoy
        </button>
      </nav>

      {/* Tab View: Sales */}
      {activeTab === 'sales' && (
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Category Pills */}
          <div className="p-3 bg-zinc-900 border-b border-zinc-800 shrink-0 space-y-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar vinil, polarizado, SKU..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
              {(['all', 'Polarizados', 'Vinilos', 'Accesorios'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full font-bold shrink-0 transition ${
                    selectedCategory === cat
                      ? 'bg-white text-zinc-950 shadow'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                <span className="text-xs">Cargando inventario...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-xs">
                No se encontraron productos coincidentes.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={setActiveProductForModal}
                />
              ))
            )}
          </div>

          {/* Floating Cart CTA */}
          <div className="p-3 pb-safe bg-zinc-900 border-t border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (cart.length === 0) {
                  showToast('Toca un producto para agregarlo al ticket');
                } else {
                  setIsCartOpen(true);
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white py-3.5 px-4 rounded-2xl flex items-center justify-between shadow-xl shadow-emerald-600/25 transition font-bold"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
                  {cart.length}
                </span>
                <span className="text-xs tracking-wide">Ticket de Venta</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tabular-nums">{formatBs(cartTotal)}</span>
                <ShoppingBag className="w-4 h-4 opacity-80" />
              </div>
            </button>
          </div>
        </main>
      )}

      {/* Tab View: Daily Closure */}
      {activeTab === 'closure' && <DailyClosureView />}

      {/* Modals */}
      <UnitSelectionModal
        product={activeProductForModal}
        onClose={() => setActiveProductForModal(null)}
        onAddToCart={handleAddToCart}
      />

      {isCartOpen && (
        <CartCheckoutModal
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onRemoveItem={handleRemoveItem}
          onClearCart={() => setCart([])}
          onSaleCompleted={handleSaleCompleted}
        />
      )}
    </div>
  );
}
