/**
 * WhatsApp deep link builder.
 * PRD R6: links must pre-fill the garment title in the message.
 *
 * Phase 4 task 4.4
 */
import { CONTACT } from "./constants";

/**
 * Build a wa.me link pre-filled with the garment name.
 * @param garmentTitle - The garment title to reference in the message
 */
export function buildWhatsAppLink(garmentTitle?: string): string {
  const base = `https://wa.me/${CONTACT.whatsapp}`;
  const text = garmentTitle
    ? `Hi Saroj Couture, I'm interested in ${garmentTitle}`
    : "Hi Saroj Couture, I'd like to know more about your work";
  return `${base}?text=${encodeURIComponent(text)}`;
}
