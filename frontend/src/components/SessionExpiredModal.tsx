import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  resetSessionExpiredNotification,
  SESSION_EXPIRED_EVENT,
} from '../api/client';

export function SessionExpiredModal() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const onExpired = () => setOpen(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const handleGoToLogin = () => {
    resetSessionExpiredNotification();
    logout();
    setOpen(false);
    navigate('/login', { replace: true });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('auth.sessionExpiredTitle')}
          </h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-slate-600">{t('auth.sessionExpiredMessage')}</p>
        </div>
        <div className="px-6 py-4 flex justify-end bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={handleGoToLogin}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
          >
            {t('auth.sessionExpiredConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
