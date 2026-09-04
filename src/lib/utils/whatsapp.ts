/**
 * WhatsApp deep link builder.
 * PRD R6: links must pre-fill the garment title in the message.
 *
 * Phase 4 task 4.4
 */
import { CONTACT } from "./constants";

// wa.me requires digits only — no "+", spaces, or dashes.
const WHATSAPP_DIGITS = CONTACT.whatsapp.replace(/[^0-9]/g, "");

/**
 * Build a wa.me link pre-filled with an arbitrary message.
 * @param message - The pre-filled message text (optional)
 */
export function buildWhatsAppMessageLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_DIGITS}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Build a wa.me link pre-filled with the garment name.
 * @param garmentTitle - The garment title to reference in the message
 */
export function buildWhatsAppLink(garmentTitle?: string): string {
  const text = garmentTitle
    ? `Hi Saroj Couture, I'm interested in ${garmentTitle}`
    : "Hi Saroj Couture, I'd like to know more about your work";
  return buildWhatsAppMessageLink(text);
}
