/**
 * AURELIA — Shortlet Reservation Domain Configuration
 * 
 * Defines authoritative domain configuration for the Aurelia Sanctuary luxury shortlet.
 * Keeps pricing and reference prefix rules decoupled from ORA Core.
 */

export interface AureliaReservationConfig {
  propertyId: string;
  propertyName: string;
  tagline: string;
  currency: string;
  nightlyRate: number;
  referencePrefix: string;
  /**
   * Optional host/concierge WhatsApp number in international E.164 format (digits only, e.g. "14155552671").
   * When not configured (undefined/empty), the visitor selects their own recipient on WhatsApp.
   */
  hostWhatsAppNumber?: string;
}

/**
 * Validates international E.164 digits format (7 to 15 digits without symbols).
 */
export function isValidWhatsAppNumber(numberStr?: string): boolean {
  if (!numberStr) return false;
  const digits = numberStr.replace(/[^0-9]/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export const AURELIA_RESERVATION_CONFIG: AureliaReservationConfig = {
  propertyId: "aurelia-sanctuary",
  propertyName: "Aurelia Sanctuary",
  tagline: "A secluded modernist retreat nestled above the highland valley",
  currency: "USD",
  // Reference-environment rate for buyout demonstration calculations.
  // Actual property bookings and market rates remain available on inquiry with the host.
  nightlyRate: 1850,
  referencePrefix: "AUR",
  // By default, no host WhatsApp number is hardcoded or fabricated.
  // When empty or unconfigured, the visitor chooses their recipient or concierge.
  hostWhatsAppNumber: undefined
} as const;

