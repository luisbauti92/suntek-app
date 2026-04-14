import {
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeft,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ErpNavId } from './erpNav';

interface AppSidebarProps {
  active: ErpNavId;
  onNavigate: (id: ErpNavId) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isAdmin: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({
  active,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  isAdmin,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  const { t } = useLanguage();

  const items: { id: ErpNavId; icon: typeof LayoutDashboard; labelKey: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, labelKey: 'erp.navDashboard' },
    { id: 'warehouse', icon: Package, labelKey: 'erp.navWarehouse' },
    { id: 'sales', icon: ShoppingCart, labelKey: 'erp.navSales' },
    ...(isAdmin ? ([{ id: 'users', icon: Users, labelKey: 'erp.navUsers' }] as const) : []),
    { id: 'settings', icon: Settings, labelKey: 'erp.navSettings' },
  ];

  function go(id: ErpNavId) {
    onNavigate(id);
    onMobileClose();
  }

  return (
    <aside
      className={[
        'flex min-h-screen shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950 text-zinc-100',
        'transition-[width,transform] duration-200 ease-out',
        collapsed ? 'w-[4.25rem]' : 'w-56',
        'fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}
      aria-label={t('erp.sidebarAria')}
    >
      <div className="flex h-14 items-center gap-2 border-b border-zinc-800/80 px-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold tracking-tight text-white">
          S
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-white">SUNTEK</p>
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              {t('erp.brandSubtitle')}
            </p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {items.map(({ id, icon: Icon, labelKey }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              title={collapsed ? t(labelKey) : undefined}
              className={[
                'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/80'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
                collapsed && 'justify-center px-2',
              ].join(' ')}
            >
              <Icon
                className={['h-5 w-5 shrink-0', isActive ? 'text-violet-400' : 'text-zinc-500'].join(' ')}
                aria-hidden
              />
              {!collapsed && <span className="truncate">{t(labelKey)}</span>}
            </button>
          );
        })}
      </nav>

      <div className="hidden border-t border-zinc-800/80 p-2 lg:block">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5 shrink-0" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{t('erp.collapseSidebar')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
