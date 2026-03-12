import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { inventoryApi, salesApi } from '../api/client';
import { ProductForm } from '../components/ProductForm';
import { ConfirmModal } from '../components/ConfirmModal';
import { SalesEntryModal } from '../components/SalesEntryModal';
import type { InventoryItemDto, MovementDto } from '../api/client';

function formatRetailQuantity(item: InventoryItemDto): string {
  const isMeters = item.unitType === 'Meters' || item.unitType === 0;
  if (isMeters) {
    return `${Number(item.retailQuantity).toFixed(2)} mt`;
  }
  return `${Math.round(item.retailQuantity)} units`;
}

export function InventoryDashboard() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'warehouse' | 'storefront' | 'movements'>('warehouse');
  const [openBoxProductId, setOpenBoxProductId] = useState<number | null>(null);
  const [openBoxLoading, setOpenBoxLoading] = useState(false);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [movements, setMovements] = useState<MovementDto[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  const refreshItems = useCallback(() => {
    setLoading(true);
    inventoryApi
      .list()
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  const refreshMovements = useCallback(() => {
    setMovementsLoading(true);
    salesApi
      .listMovements()
      .then((res) => setMovements(res.data))
      .catch(() => setMovements([]))
      .finally(() => setMovementsLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'movements') refreshMovements();
  }, [activeTab, refreshMovements]);

  function handleOpenBoxClick(productId: number) {
    setOpenBoxProductId(productId);
  }

  async function handleOpenBoxConfirm() {
    if (openBoxProductId == null) return;
    setOpenBoxLoading(true);
    try {
      await inventoryApi.openBox(openBoxProductId);
      refreshItems();
      refreshMovements();
      setOpenBoxProductId(null);
      toast.success('Box opened! Stock added to Storefront.');
    } catch {
      // Error - list will not refresh
    } finally {
      setOpenBoxLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">SUNTEK · Inventory</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.email}</span>
            <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
              {user?.roles.join(', ')}
            </span>
            <button
              onClick={logout}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('warehouse')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'warehouse'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Warehouse
            </button>
            <button
              onClick={() => setActiveTab('storefront')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'storefront'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Storefront
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'movements'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Movement History
            </button>
          </div>
          <div className="flex gap-2">
          <button
            onClick={() => setSalesModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Record Sale
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
          </div>
        </div>

        <ProductForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={refreshItems}
        />

        <SalesEntryModal
          isOpen={salesModalOpen}
          onClose={() => setSalesModalOpen(false)}
          onSuccess={() => { refreshItems(); if (activeTab === 'movements') refreshMovements(); }}
          products={items}
        />

        <ConfirmModal
          isOpen={openBoxProductId != null}
          onClose={() => setOpenBoxProductId(null)}
          onConfirm={handleOpenBoxConfirm}
          title="Open Box"
          message="Are you sure you want to open this box? This will move rolls to the retail storefront stock."
          confirmLabel="Open Box"
          isLoading={openBoxLoading}
        />

        {loading && activeTab !== 'movements' ? (
          <div className="animate-pulse bg-white rounded-lg border border-slate-200 p-8">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded" />
              ))}
            </div>
          </div>
        ) : activeTab === 'movements' ? (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            {movementsLoading ? (
              <div className="animate-pulse p-8">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 bg-slate-100 rounded" />
                  ))}
                </div>
              </div>
            ) : movements.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No movement history yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock after</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{m.movementType}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {m.productSku} · {m.productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{m.description}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {m.wholesaleQuantityAfter != null && (
                          <span className="mr-2">{m.wholesaleQuantityAfter} box(es)</span>
                        )}
                        {m.retailQuantityAfter != null && (
                          <span>{Number(m.retailQuantityAfter).toFixed(2)} retail</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
            No inventory items yet.
          </div>
        ) : activeTab === 'warehouse' ? (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Boxes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rolls/Box</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.wholesaleQuantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.rollsPerBox}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                      {item.wholesaleQuantity * item.rollsPerBox}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenBoxClick(item.id)}
                        disabled={item.wholesaleQuantity < 1 || openBoxLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Open Box
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Available</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price/Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price/M</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.name}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {formatRetailQuantity(item)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">${item.pricePerRoll.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">${item.pricePerMeter.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
