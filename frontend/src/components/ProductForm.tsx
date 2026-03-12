import { useState } from 'react';
import { toast } from 'sonner';
import { inventoryApi, type RegisterStockRequest, type UnitType } from '../api/client';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialValues: RegisterStockRequest = {
  sku: '',
  name: '',
  quantity: 0,
  length: 0,
  width: 0,
  pricePerRoll: 0,
  pricePerMeter: 0,
  rollsPerBox: 1,
  unitType: 'Meters',
};

export function ProductForm({ isOpen, onClose, onSuccess }: ProductFormProps) {
  const [form, setForm] = useState<RegisterStockRequest>(initialValues);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    const parsed =
      ['quantity', 'length', 'width', 'pricePerRoll', 'pricePerMeter', 'rollsPerBox'].includes(
        name
      )
        ? (name === 'rollsPerBox' ? parseInt(value, 10) || 0 : parseFloat(value) || 0)
        : value;
    setForm((prev) => ({ ...prev, [name]: parsed }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await inventoryApi.register(form);
      setForm(initialValues);
      onSuccess();
      onClose();
      toast.success('Product registered successfully.');
    } catch (err: unknown) {
      let msg = 'Failed to register product.';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: unknown } }).response?.data;
        if (res && typeof res === 'object' && 'message' in res) {
          msg = String((res as { message: unknown }).message);
        }
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-semibold text-slate-900">
            Add Product
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Register a new product in inventory
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sku"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                SKU
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                value={form.sku}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. SKU-001"
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Product name"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={0}
              step={1}
              value={form.quantity || ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="length"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Length (m)
              </label>
              <input
                id="length"
                name="length"
                type="number"
                min={0}
                step={0.01}
                value={form.length || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label
                htmlFor="width"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Width (m)
              </label>
              <input
                id="width"
                name="width"
                type="number"
                min={0}
                step={0.01}
                value={form.width || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="rollsPerBox"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Rolls per box
              </label>
              <input
                id="rollsPerBox"
                name="rollsPerBox"
                type="number"
                min={1}
                step={1}
                value={form.rollsPerBox || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="1"
              />
            </div>
            <div>
              <label
                htmlFor="unitType"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Unit type
              </label>
              <select
                id="unitType"
                name="unitType"
                value={form.unitType}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, unitType: e.target.value as UnitType }));
                  setError('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="Meters">Meters (vinyl rolls)</option>
                <option value="Units">Units (tools/accessories)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="pricePerRoll"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Price per roll
              </label>
              <input
                id="pricePerRoll"
                name="pricePerRoll"
                type="number"
                min={0}
                step={0.01}
                value={form.pricePerRoll || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label
                htmlFor="pricePerMeter"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Price per meter
              </label>
              <input
                id="pricePerMeter"
                name="pricePerMeter"
                type="number"
                min={0}
                step={0.01}
                value={form.pricePerMeter || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Registering…' : 'Register Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
