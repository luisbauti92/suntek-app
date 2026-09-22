import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LogOut,
  WifiOff,
  ShoppingBag,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';
import type { ProductDto, CartItem, AuthUser, BatchSaleResponse, CategoryFilter, SaleMode } from './types';
import { inventoryApi, authApi } from './api/client';
import { ProductBrowser } from './components/ProductBrowser';
import { TicketRail } from './components/TicketRail';
import { UnitSelectionModal } from './components/UnitSelectionModal';
import { CartCheckoutModal } from './components/CartCheckoutModal';
import { DailyClosureView } from './components/DailyClosureView';
import { LoginModal } from './components/LoginModal';
import { useMediaQuery } from './hooks/useMediaQuery';
import { formatBs } from './utils/formatBs';
import { haptics } from './utils/haptics';
import { defaultMode, describeQuantity, resolveSaleLine } from './utils/saleUnits';

const DESKTOP_QUERY = '(min-width: 768px)';

export function App() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authApi.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'sales' | 'closure'>('sales');

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartPulsing, setCartPulsing] = useState(false);
  const [activeProductForModal, setActiveProductForModal] = useState<ProductDto | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    function handleAuthChange() {
      setCurrentUser(authApi.getCurrentUser());
    }
    window.addEventListener('suntek_pos_auth_change', handleAuthChange);
    return () => window.removeEventListener('suntek_pos_auth_change', handleAuthChange);
  }, []);

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

  function pulseCart() {
    setCartPulsing(true);
    setTimeout(() => setCartPulsing(false), 350);
  }

  function buildCartItem(product: ProductDto, mode: SaleMode, quantity: number): CartItem {
    const line = resolveSaleLine(product, mode, quantity);
    return {
      cartId: `${product.id}-${mode}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: line.deductedQuantity,
      saleType: line.saleType,
      unitLabel: describeQuantity(quantity, line.unitLabel),
      unitPrice: line.unitPrice,
      subtotal: line.subtotal,
      mode,
      enteredQuantity: quantity,
    };
  }

  /** Re-derive a line's price, sale type and deducted stock from the product and unit. */
  function applyLine(
    product: ProductDto,
    item: CartItem,
    mode: SaleMode,
    enteredQuantity: number
  ): CartItem {
    const line = resolveSaleLine(product, mode, enteredQuantity);
    return {
      ...item,
      mode,
      enteredQuantity,
      quantity: line.deductedQuantity,
      saleType: line.saleType,
      unitPrice: line.unitPrice,
      unitLabel: describeQuantity(enteredQuantity, line.unitLabel),
      subtotal: line.subtotal,
    };
  }

  // Mobile flow: the sheet hands over an already-resolved line.
  function handleAddToCart(item: CartItem) {
    setCart((prev) => [...prev, item]);
    pulseCart();
    haptics.tap();
    showToast('Añadido al ticket');
  }

  // Desktop flow: a product tap adds one unit of the default unit, merging with a matching line.
  function handleQuickAdd(product: ProductDto) {
    const mode = defaultMode(product);
    setCart((prev) => {
      const index = prev.findIndex((i) => i.productId === product.id && i.mode === mode);
      if (index === -1) return [...prev, buildCartItem(product, mode, 1)];
      const next = [...prev];
      next[index] = applyLine(product, next[index], mode, next[index].enteredQuantity + 1);
      return next;
    });
    pulseCart();
    haptics.tap();
    showToast('Añadido al ticket');
  }

  function handleChangeLine(
    cartId: string,
    patch: { mode?: SaleMode; enteredQuantity?: number }
  ) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId !== cartId) return item;
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;
        const mode = patch.mode ?? item.mode;
        const enteredQuantity = patch.enteredQuantity ?? 1;
        if (!(enteredQuantity > 0)) return item;
        return applyLine(product, item, mode, enteredQuantity);
      })
    );
  }

  function handleRemoveItem(cartId: string) {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
    haptics.tap();
  }

  function handleSaleCompleted(res: BatchSaleResponse) {
    showToast(`Ticket ${res.ticketCode || ''} registrado (${formatBs(res.totalAmount)})`);
    loadProducts();
  }

  function handleProductTap(product: ProductDto) {
    if (isDesktop) {
      handleQuickAdd(product);
    } else {
      setActiveProductForModal(product);
    }
  }

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
    <div className="relative flex h-dvh flex-col bg-zinc-950 text-white">
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-900 pt-safe">
        <div className="flex items-center gap-4 px-4 pb-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-400/30 bg-[#0038a8] text-xs font-black tracking-wider text-white">
                ST
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-wider text-white">SUNTEK</span>
                  <span className="rounded border border-blue-700/60 bg-blue-900/60 px-1.5 py-0.5 text-[10px] font-bold text-blue-200">
                    POS
                  </span>
                </div>
                <div className="max-w-[140px] truncate text-[10px] font-medium text-zinc-400 md:hidden">
                  {currentUser.email.split('@')[0]}
                </div>
              </div>
            </div>

            <ViewTabs variant="inline" activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <span className="hidden max-w-[140px] truncate text-[11px] font-medium text-zinc-400 md:block">
              {currentUser.email.split('@')[0]}
            </span>

            <div className="flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-800/90 px-2.5 py-1 text-[10px] text-zinc-200">
              {isOnline ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-emerald-300">En línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-rose-400" aria-hidden />
                  <span className="font-semibold text-rose-400">Offline</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={authApi.logout}
              aria-label="Cerrar sesión"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-800/90 text-zinc-400 transition hover:text-rose-400 active:scale-95 md:h-8 md:w-8"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="md:hidden">
          <ViewTabs variant="segmented" activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col">
        <h1 className="sr-only">SUNTEK POS</h1>

        {toastMessage && (
          <div
            role="status"
            className="absolute inset-x-4 top-3 z-50 mx-auto flex max-w-md items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xl animate-in slide-in-from-top duration-200 md:inset-x-auto md:right-4 md:mx-0 md:max-w-sm"
          >
            <span>{toastMessage}</span>
          </div>
        )}

        {activeTab === 'sales' ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[minmax(0,1fr)_360px] lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
              <ProductBrowser
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                products={filteredProducts}
                loading={loading}
                onSelectProduct={handleProductTap}
              />

              <TicketRail
                cart={cart}
                products={products}
                onRemoveLine={handleRemoveItem}
                onChangeLine={handleChangeLine}
                onClearCart={() => setCart([])}
                onSaleCompleted={handleSaleCompleted}
              />
            </div>

            <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/95 p-3 pb-safe md:hidden">
              <button
                type="button"
                onClick={() => {
                  if (cart.length === 0) {
                    showToast('Toca un producto para agregarlo al ticket');
                  } else {
                    setIsCartOpen(true);
                  }
                }}
                className="flex min-h-[52px] w-full items-center justify-between rounded-2xl border border-emerald-700 bg-emerald-600 px-4 py-3 font-bold text-white shadow-lg shadow-emerald-900/40 transition-all hover:bg-emerald-500 active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${
                      cartPulsing ? 'scale-125 bg-white text-emerald-900' : 'bg-white/25 text-white'
                    }`}
                  >
                    {cart.length}
                  </span>
                  <span className="text-xs uppercase tracking-wide">Ticket de venta</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tabular-nums">{formatBs(cartTotal)}</span>
                  <ShoppingBag className="h-4 w-4 opacity-90" aria-hidden />
                </div>
              </button>
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden">
            <DailyClosureView />
          </div>
        )}
      </main>

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

function ViewTabs({
  variant,
  activeTab,
  onChange,
}: {
  variant: 'segmented' | 'inline';
  activeTab: 'sales' | 'closure';
  onChange: (tab: 'sales' | 'closure') => void;
}) {
  const tabs = [
    { id: 'sales' as const, label: 'Nueva venta', short: 'Venta', Icon: ShoppingCart },
    { id: 'closure' as const, label: 'Arqueo de hoy', short: 'Arqueo', Icon: BarChart3 },
  ];

  if (variant === 'inline') {
    return (
      <nav
        aria-label="Vistas"
        className="hidden items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-1 md:flex"
      >
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onChange(id)}
              className={`flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                active
                  ? 'bg-[#0038a8] text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Vistas" className="flex gap-1.5 border-t border-zinc-800/90 bg-zinc-900/95 px-3 py-1.5 text-xs">
      {tabs.map(({ id, short, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(id)}
            className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 font-bold transition active:scale-[0.98] ${
              active
                ? 'bg-[#0038a8] text-white'
                : 'text-zinc-400 hover:text-zinc-200 active:bg-zinc-800'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {short}
          </button>
        );
      })}
    </nav>
  );
}
