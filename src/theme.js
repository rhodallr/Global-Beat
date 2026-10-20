/* ──────────────────────────────────────────────────────────────────────────
   eeze brand colours and fonts — the ONE place to change the look.

   Source: eeze Brand Guidelines V1.2. Tailwind reads BRAND too
   (see tailwind.config.js), so you can write classes like
   `bg-eeze-dark-blue` or `text-eeze-dark-blue/60` anywhere in the app.
   The downloaded image (src/lib/exportImage.js) uses these same values.
   ────────────────────────────────────────────────────────────────────────── */

export const BRAND = {
  "dark-blue": "#1F0575", // core base: header, text
  purple: "#650BFF", // core base
  "deep-navy": "#1E1432",
  blue: "#007BFF",
  "light-blue": "#C6E1FF",
  "blue-tint": "#E8EFF8", // page background
  "lilac-tint": "#EADFFF",
  green: "#11D79F",
  "green-tint": "#DBFBF0",
  "pale-yellow": "#FFF3A4",
  "yellow-tint": "#FFFBE2",
  "neon-yellow": "#E7FF0B", // accent: only the "." after BEYOND BORDERS
  white: "#FFFFFF",
};

// Trebuchet MS is the brand's approved stand-in for the licensed "Obviously" font.
export const FONT = '"Obviously", "Trebuchet MS", -apple-system, "Segoe UI", system-ui, sans-serif';

// Same as BRAND["dark-blue"] with transparency, for shadows and muted text.
export const ink = (alpha) => `rgba(31, 5, 117, ${alpha})`;
