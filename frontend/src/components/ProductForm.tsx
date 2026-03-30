import { useState } from 'react';
import { toast } from 'sonner';
import { inventoryApi, type RegisterStockRequest, type UnitType } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';
import { roundMoney2 } from '../utils/money';

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
  const { t } = useLanguage();
  const [form, setForm] = useState<RegisterStockRequest>(initialValues);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    const parsed = [
      'quantity',
      'length',
      'width',
      'pricePerRoll',
      'pricePerMeter',
      'rollsPerBox',
    ].includes(name)
      ? name === 'rollsPerBox'
        ? parseInt(value, 10) || 0
        : parseFloat(value) || 0
      : value;
    setForm((prev) => ({ ...prev, [name]: parsed }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await inventoryApi.register({
        ...form,
        length: roundMoney2(Number(form.length)),
        width: roundMoney2(Number(form.width)),
        pricePerRoll: roundMoney2(Number(form.pricePerRoll)),
        pricePerMeter: roundMoney2(Number(form.pricePerMeter)),
      });
      setForm(initialValues);
      onSuccess();
      onClose();
      toast.success(t('productForm.registerSuccess'));
    } catch (err: unknown) {
      let msg = t('productForm.registerFailed');
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
          <h2 className="text-lg font-semibold text-slate-900">{t('productForm.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('productForm.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-slate-700 mb-1">
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
                placeholder={t('productForm.skuPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                {t('dashboard.name')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('productForm.namePlaceholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">
              {t('productForm.quantity')}
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
              <label htmlFor="length" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.length')}
              </label>
              <input
                id="length"
                name="length"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={form.length || ''}
                onChange={handleChange}
                onBlur={() =>
                  setForm((prev) => ({ ...prev, length: roundMoney2(Number(prev.length)) }))
                }
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="width" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.width')}
              </label>
              <input
                id="width"
                name="width"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={form.width || ''}
                onChange={handleChange}
                onBlur={() =>
                  setForm((prev) => ({ ...prev, width: roundMoney2(Number(prev.width)) }))
                }
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rollsPerBox" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.rollsPerBox')}
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
              <label htmlFor="unitType" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.unitType')}
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
                <option value="Meters">{t('productForm.unitMeters')}</option>
                <option value="Units">{t('productForm.unitUnits')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pricePerRoll" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.pricePerRoll')}
              </label>
              <input
                id="pricePerRoll"
                name="pricePerRoll"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={form.pricePerRoll || ''}
                onChange={handleChange}
                onBlur={() =>
                  setForm((prev) => ({
                    ...prev,
                    pricePerRoll: roundMoney2(Number(prev.pricePerRoll)),
                  }))
                }
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="pricePerMeter" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.pricePerMeter')}
              </label>
              <input
                id="pricePerMeter"
                name="pricePerMeter"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={form.pricePerMeter || ''}
                onChange={handleChange}
                onBlur={() =>
                  setForm((prev) => ({
                    ...prev,
                    pricePerMeter: roundMoney2(Number(prev.pricePerMeter)),
                  }))
                }
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {isSubmitting ? t('productForm.registering') : t('productForm.registerProduct')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
