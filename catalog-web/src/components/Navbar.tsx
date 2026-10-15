import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { LanguageSwitcher } from './LanguageSwitcher';
import { WhatsAppIcon } from './WhatsAppIcon';
import logo from '../assets/logo.svg';
interface NavbarProps { search: ReactNode; }
export function Navbar({ search }: NavbarProps) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const waUrl = buildWhatsAppUrl(t('whatsapp.generalMessage'));
  return <header className="catalog-header">
    <button type="button" className="mobile-menu" aria-label={t('nav.menu')} aria-expanded={menuOpen}
      aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} aria-hidden /></button>
    <a href="#" className="brand"><img src={logo} alt="" />SUNTEK</a>
    <nav className="desktop-nav" aria-label={t('nav.navigation')}>
      <a href="#catalog">{t('listing.title')}</a><a href="#materials">{t('categories.title')}</a>
      <a href={waUrl} target="_blank" rel="noopener noreferrer">{t('nav.contact')}</a>
    </nav>
    <div className="header-search">{search}</div>
    <div className="header-language"><LanguageSwitcher /></div>
    <a className="header-whatsapp" href={waUrl} aria-label={t('nav.whatsapp')} target="_blank" rel="noopener noreferrer">
      <WhatsAppIcon /><span className="wa-label">{t('nav.whatsapp')}</span>
    </a>
    {menuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label={t('nav.navigation')}
      onKeyDown={event => { if (event.key === 'Escape') setMenuOpen(false); }}>
      <a href="#catalog" onClick={() => setMenuOpen(false)}>{t('listing.title')}</a>
      <a href="#materials" onClick={() => setMenuOpen(false)}>{t('categories.title')}</a>
      <LanguageSwitcher />
    </nav>}
  </header>;
}
