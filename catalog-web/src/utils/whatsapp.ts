const WHATSAPP_E164 = '59167359239';

/**
 * CTA URL per product (fixed business number + Spanish copy).
 * @see https://wa.me/59167359239?text=...
 */
export function buildCatalogWhatsAppUrl(productName: string, sku: string): string {
  const text = `Hola SUNTEK, estoy interesado en el producto ${productName} (SKU: ${sku}) que vi en su catálogo web`;
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(text)}`;
}
