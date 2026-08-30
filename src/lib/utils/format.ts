/**
 * Shared pure utility functions — no server imports, safe to use in any component.
 */

/** Format a garment price for display in INR. */
export function formatPrice(price: number | null, priceType: string): string {
  if (priceType === "on_enquiry" || price === null) return "Enquire for price";
  const formatted = new Intl.NumberFormat("en-IN").format(price);
  if (priceType === "starting_from") return `Starting from ₹${formatted}`;
  return `₹${formatted}`;
}
