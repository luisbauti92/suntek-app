import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

const LOGO_SRC = '/assets/logo-suntek.webp';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function Navbar({ searchQuery, onSearchChange }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 bg-[var(--primary)] text-white transition-shadow duration-300 ${
        scrolled ? 'shadow-lg shadow-[#002d9c]/35' : ''
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-8 md:py-4">
        <a
          href="#"
          className="flex shrink-0 items-center gap-3 text-left no-underline"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {logoOk ? (
            <img
              src={LOGO_SRC}
              alt="SUNTEK — Importadora"
              className="h-9 w-auto max-w-[220px] object-contain object-left md:h-11"
              width={220}
              height={48}
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="text-lg font-bold tracking-tight text-white md:text-xl">SUNTEK</span>
          )}
        </a>

        <div className="relative min-w-0 flex-1 md:max-w-2xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary)]/50"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="w-full rounded-lg border border-white/25 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm outline-none ring-[var(--secondary)] transition placeholder:text-slate-400 focus:border-[var(--secondary)] focus:ring-2"
            autoComplete="off"
            aria-label="Buscar en el catálogo"
          />
        </div>
      </div>
    </header>
  );
}
