/**
 * Fallback when `imageUrl` is missing or the image fails to load (catálogo sin backend o asset pendiente).
 */
export function BrandedProductImagePlaceholder() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[var(--primary)] via-[#003cb8] to-[var(--secondary)] px-3 py-6 text-center shadow-inner"
      role="img"
      aria-label="Imagen no disponible — stock próximamente"
    >
      <p className="max-w-[14rem] text-xs font-bold uppercase leading-snug tracking-wide text-white sm:text-sm">
        STOCK DISPONIBLE MUY PRONTO
      </p>
      <p className="mt-3 max-w-[16rem] text-[10px] font-medium leading-relaxed text-white/90 sm:text-xs">
        Importadora SUNTEK - Sincronizando catálogo
      </p>
    </div>
  );
}
