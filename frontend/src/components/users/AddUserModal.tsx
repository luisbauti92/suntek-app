import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../../api/client';
import { useLanguage } from '../../contexts/LanguageContext';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Operator' | 'Admin'>('Operator');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      toast.success(t('erp.userCreatedToast'));
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('Operator');
      onSuccess();
      onClose();
    } catch {
      toast.error(t('erp.userCreateError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[2px]"
        aria-label={t('common.cancel')}
        onClick={() => !submitting && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl ring-1 ring-black/5"
      >
        <h2 id="add-user-title" className="text-lg font-semibold tracking-tight text-slate-900">
          {t('erp.addUserTitle')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{t('erp.addUserSubtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="nu-name" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('erp.fullName')}
            </label>
            <input
              id="nu-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              placeholder={t('erp.fullNamePlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="nu-email" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('auth.email')}
            </label>
            <input
              id="nu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div>
            <label htmlFor="nu-pass" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('auth.password')}
            </label>
            <input
              id="nu-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            <p className="mt-1 text-xs text-slate-400">{t('erp.passwordPolicyHint')}</p>
          </div>
          <div>
            <label htmlFor="nu-role" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('erp.roleLabel')}
            </label>
            <select
              id="nu-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'Operator' | 'Admin')}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="Operator">{t('erp.roleWarehouse')}</option>
              <option value="Admin">{t('erp.roleAdmin')}</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('erp.addUserSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
