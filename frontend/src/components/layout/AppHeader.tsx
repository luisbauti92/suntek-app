import { useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useClickOutside } from '../../hooks/useClickOutside';

interface AppHeaderProps {
  onMenuClick: () => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  searchEnabled: boolean;
}

export function AppHeader({
  onMenuClick,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchEnabled,
}: AppHeaderProps) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useClickOutside(profileRef, () => setProfileOpen(false), profileOpen);
  useClickOutside(notifRef, () => setNotifOpen(false), notifOpen);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 md:px-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
        aria-label={t('erp.openMenu')}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 flex-1 max-w-xl">
        {searchEnabled ? (
          <>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              autoComplete="off"
            />
          </>
        ) : (
          <div className="hidden text-sm text-slate-400 sm:block">{t('erp.globalSearchDisabled')}</div>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setProfileOpen(false);
            }}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            aria-label={t('erp.notifications')}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 ring-2 ring-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-1 w-72 rounded-xl border border-slate-200 bg-white py-3 shadow-lg ring-1 ring-black/5">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('erp.notifications')}
              </p>
              <p className="px-3 pt-2 text-sm text-slate-600">{t('erp.notificationsEmpty')}</p>
            </div>
          )}
        </div>

        <LanguageSwitcher compact />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((o) => !o);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1 pl-1 pr-2 shadow-sm transition hover:bg-slate-50"
            aria-expanded={profileOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-100 text-violet-700">
              <User className="h-4 w-4" />
            </span>
            <span className="hidden max-w-[140px] truncate text-left text-xs font-medium text-slate-800 sm:block">
              {user?.email}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-xs font-medium text-slate-900">{user?.email}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{user?.roles.join(' · ')}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4 text-slate-500" />
                {t('dashboard.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
