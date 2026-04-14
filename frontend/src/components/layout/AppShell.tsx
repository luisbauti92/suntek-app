import type { ReactNode } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import type { ErpNavId } from './erpNav';

interface AppShellProps {
  children: ReactNode;
  activeNav: ErpNavId;
  onNavigate: (id: ErpNavId) => void;
  isAdmin: boolean;
  sidebarCollapsed: boolean;
  onToggleSidebarCollapsed: () => void;
  mobileSidebarOpen: boolean;
  onMobileSidebarOpenChange: (open: boolean) => void;
  headerSearchValue: string;
  onHeaderSearchChange: (v: string) => void;
  headerSearchPlaceholder: string;
  headerSearchEnabled: boolean;
}

export function AppShell({
  children,
  activeNav,
  onNavigate,
  isAdmin,
  sidebarCollapsed,
  onToggleSidebarCollapsed,
  mobileSidebarOpen,
  onMobileSidebarOpenChange,
  headerSearchValue,
  onHeaderSearchChange,
  headerSearchPlaceholder,
  headerSearchEnabled,
}: AppShellProps) {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-[1px] lg:hidden"
          aria-label={t('erp.closeMenu')}
          onClick={() => onMobileSidebarOpenChange(false)}
        />
      )}

      <AppSidebar
        active={activeNav}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={onToggleSidebarCollapsed}
        isAdmin={isAdmin}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => onMobileSidebarOpenChange(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-screen">
        <AppHeader
          onMenuClick={() => onMobileSidebarOpenChange(true)}
          searchValue={headerSearchValue}
          onSearchChange={onHeaderSearchChange}
          searchPlaceholder={headerSearchPlaceholder}
          searchEnabled={headerSearchEnabled}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
