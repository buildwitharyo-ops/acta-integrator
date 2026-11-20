"use client";

import { useSyncExternalStore } from "react";

const preference = "(prefers-reduced-motion: reduce)";

function subscribe(notify: () => void) {
  const query = window.matchMedia(preference);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

function readPreference() {
  return window.matchMedia(preference).matches;
}

// Render the same control tree on the server and during the first hydration pass.
export function useHomeReducedMotion() {
  return useSyncExternalStore(subscribe, readPreference, () => false);
}
