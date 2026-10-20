import { BRAND } from "../theme.js";

/* The five colour-coded regions. Each event in events.js uses one of these keys.

   color    → event labels and filter buttons
   text     → text on top of `color` (picked for readable contrast)
   tint     → background of a day that has events in this region */

export const REGIONS = {
  asia: { label: "Asia & Pacific", color: BRAND.purple, text: BRAND.white, tint: BRAND["lilac-tint"] },
  americas: { label: "Americas", color: BRAND.blue, text: BRAND.white, tint: BRAND["light-blue"] },
  europe: { label: "Europe", color: BRAND["pale-yellow"], text: BRAND["dark-blue"], tint: BRAND["yellow-tint"] },
  africa: { label: "Africa & Middle East", color: BRAND.green, text: BRAND["dark-blue"], tint: BRAND["green-tint"] },
  // White tint: the brand's blue tint is also the page background, so Global days looked empty.
  global: { label: "Global & Multicultural", color: BRAND["dark-blue"], text: BRAND.white, tint: BRAND.white },
};

// The order regions appear in filters, legends and on busy days.
export const REGION_ORDER = ["asia", "americas", "europe", "africa", "global"];
