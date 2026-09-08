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
  const [cartPulsing, setCartPulsing] = useState(false);
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
    setCartPulsing(true);
    setTimeout(() => setCartPulsing(false), 350);
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
      <header className="bg-zinc-900 border-b border-zinc-800/90 pt-safe pb-3 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0038a8] border border-blue-400/30 flex items-center justify-center font-black text-xs tracking-wider text-white shadow-md shadow-[#0038a8]/30">
            ST
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider text-white">SUNTEK</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-200 border border-blue-700/60">POS</span>
            </div>
            <div className="text-[10px] text-zinc-300 truncate max-w-[140px] font-medium">
              {currentUser.email.split('@')[0]}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/90 border border-zinc-700/60 text-[10px] text-zinc-200">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-300">En línea</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-400" />
                <span className="font-semibold text-rose-400">Offline</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={authApi.logout}
            className="w-8 h-8 rounded-xl bg-zinc-800/90 border border-zinc-700/60 text-zinc-400 hover:text-rose-400 active:scale-95 flex items-center justify-center transition"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Segmented Control Tabs */}
      <nav className="bg-zinc-900/95 px-3 py-1.5 flex gap-1.5 border-b border-zinc-800/90 shrink-0 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex-1 py-2.5 font-bold rounded-xl transition text-center active:scale-[0.98] ${
            activeTab === 'sales'
              ? 'bg-[#0038a8] text-white shadow-md shadow-[#0038a8]/35'
              : 'text-zinc-400 hover:text-zinc-200 active:bg-zinc-800'
          }`}
        >
          🛒 Nueva Venta
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('closure')}
          className={`flex-1 py-2.5 font-bold rounded-xl transition text-center active:scale-[0.98] ${
            activeTab === 'closure'
              ? 'bg-[#0038a8] text-white shadow-md shadow-[#0038a8]/35'
              : 'text-zinc-400 hover:text-zinc-200 active:bg-zinc-800'
          }`}
        >
          📊 Arqueo de Hoy
        </button>
      </nav>

      {/* Tab View: Sales */}
      {activeTab === 'sales' && (
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Category Pills */}
          <div className="p-3 bg-zinc-900/90 border-b border-zinc-800/80 shrink-0 space-y-2.5">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar vinil, polarizado, SKU..."
                className="w-full bg-zinc-800/90 border border-zinc-700/80 rounded-xl py-2.5 pl-9 pr-9 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0038a8] focus:border-[#0038a8] transition"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-6 h-6 absolute right-2 top-2 rounded-lg bg-zinc-700/60 text-zinc-300 hover:text-white flex items-center justify-center transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
              {(['all', 'Polarizados', 'Vinilos', 'Accesorios'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full font-bold shrink-0 transition active:scale-95 ${
                    selectedCategory === cat
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'bg-zinc-800/90 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-2.5">
                <Loader2 className="w-7 h-7 animate-spin text-[#0038a8]" />
                <span className="text-xs font-semibold">Cargando catálogo...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-zinc-400 text-xs px-4">
                No se encontraron productos coincidentes con tu búsqueda.
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

          {/* Floating Cart CTA with Tactile Materiality */}
          <div className="p-3 pb-safe bg-zinc-900/95 border-t border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (cart.length === 0) {
                  showToast('Toca un producto para agregarlo al ticket');
                } else {
                  setIsCartOpen(true);
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white min-h-[52px] py-3 px-4 rounded-2xl flex items-center justify-between border-t border-white/20 border-x border-b border-emerald-700 shadow-[0_6px_20px_rgba(5,150,105,0.35)] transition-all font-bold"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                    cartPulsing
                      ? 'scale-125 bg-white text-emerald-900 shadow-lg shadow-white/50'
                      : 'bg-white/25 text-white'
                  }`}
                >
                  {cart.length}
                </span>
                <span className="text-xs tracking-wide uppercase">Ticket de Venta</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tabular-nums">{formatBs(cartTotal)}</span>
                <ShoppingBag className="w-4 h-4 opacity-90" />
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
