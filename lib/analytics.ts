declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

// The six required GA4 events (10-TECH §9).
export type AnalyticsEvent =
  | "whatsapp_click"
  | "generate_lead"
  | "quote_request"
  | "compare_add"
  | "compare_view"
  | "catalog_filter"
  | "cta_click";

export function trackEvent(
  name: AnalyticsEvent,
  params: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}
