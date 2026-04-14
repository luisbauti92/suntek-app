import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Shield, ShoppingBag, UserCircle } from 'lucide-react';
import type { UserListItemDto } from '../../api/client';
import { usersApi } from '../../api/client';
import { useLanguage } from '../../contexts/LanguageContext';
import { AddUserModal } from './AddUserModal';

function formatLastLogin(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

function StatusBadge({ status, t }: { status: UserListItemDto['status']; t: (k: string) => string }) {
  const styles =
    status === 'Active'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/15'
      : status === 'Locked'
        ? 'bg-red-50 text-red-800 ring-red-600/15'
        : 'bg-slate-100 text-slate-600 ring-slate-500/10';
  const label =
    status === 'Active' ? t('erp.statusActive') : status === 'Locked' ? t('erp.statusLocked') : t('erp.statusInactive');
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles}`}>
      {label}
    </span>
  );
}

function RoleIcons({ roles, t }: { roles: string[]; t: (k: string) => string }) {
  if (roles.length === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const primary = roles[0] ?? '';
  const isAdmin = roles.some((r) => r === 'Admin');
  const isSales = roles.some((r) => r === 'Sales');
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin && (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800 ring-1 ring-violet-600/15" title={t('erp.roleAdmin')}>
          <Shield className="h-3.5 w-3.5" aria-hidden />
          {t('erp.roleAdmin')}
        </span>
      )}
      {!isAdmin && primary === 'Operator' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-500/10">
          <UserCircle className="h-3.5 w-3.5" aria-hidden />
          {t('erp.roleWarehouse')}
        </span>
      )}
      {isSales && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 ring-1 ring-sky-600/15">
          <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
          {t('erp.roleSales')}
        </span>
      )}
      {!isAdmin && primary && primary !== 'Operator' && !isSales && (
        <span className="text-xs font-medium text-slate-600">{primary}</span>
      )}
    </div>
  );
}

interface UsersPanelProps {
  search: string;
}

export function UsersPanel({ search }: UsersPanelProps) {
  const { t, locale } = useLanguage();
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    usersApi
      .list()
      .then((r) => setUsers(r.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => refresh(), 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.roles.some((r) => r.toLowerCase().includes(q))
    );
  }, [users, search]);

  const intlLocale = locale === 'en' ? 'en-US' : 'es-VE';

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex animate-pulse flex-col gap-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-10 w-full rounded bg-slate-100" />
          <div className="h-10 w-full rounded bg-slate-100" />
          <div className="h-10 w-full rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{t('erp.usersTitle')}</h2>
          <p className="text-sm text-slate-500">{t('erp.usersSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          {t('erp.addUser')}
        </button>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <UserCircle className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">{t('erp.usersEmptyTitle')}</p>
          <p className="mt-1 text-sm text-slate-500">{t('erp.usersEmptyHint')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-950/[0.02]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">{t('erp.colName')}</th>
                  <th className="px-4 py-3">{t('auth.email')}</th>
                  <th className="px-4 py-3">{t('erp.colRole')}</th>
                  <th className="px-4 py-3">{t('erp.colStatus')}</th>
                  <th className="px-4 py-3">{t('erp.colLastLogin')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                      {t('erp.usersNoMatches')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <RoleIcons roles={u.roles} t={t} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.status} t={t} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{formatLastLogin(u.lastLoginAt, intlLocale)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddUserModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSuccess={refresh} />
    </div>
  );
}
