import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const { t } = useLanguage();
  const whatsappUrl = buildWhatsAppUrl(t('whatsapp.generalMessage'));

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-1.5">
        <a
          href="/"
          className="inline-flex min-h-11 items-center rounded text-xl font-black uppercase tracking-tight text-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          SUNTEK
        </a>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:px-4"
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span className="sr-only sm:not-sr-only">{t('nav.whatsapp')}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
