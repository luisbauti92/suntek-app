const WHATSAPP_E164 = '59167359239';

/**
 * WhatsApp deep link with a pre-filled message.
 * The message text is provided by the caller so it can be localized.
 */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}
