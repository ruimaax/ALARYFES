export type AnalyticsEvent = "Contacto" | "ClicWhatsApp";
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}
export function track(
  event: AnalyticsEvent,
  properties: Record<string, string> = {},
) {
  if (typeof window === "undefined") return;
  // No contact details are sent to analytics. Vendors load only after consent.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...properties });
  try {
    if (localStorage.getItem("alaryfes-analytics") === "accepted") {
      window.fbq?.("trackCustom", event, properties);
      window.gtag?.("event", event, properties);
    }
  } catch {
    /* Browser storage can be disabled. */
  }
}
