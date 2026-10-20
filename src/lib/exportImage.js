import { BRAND, FONT, ink } from "../theme.js";
import { REGIONS, REGION_ORDER } from "../data/regions.js";
import { MAX_EVENTS_PER_DAY, MONTHS, WEEKDAYS, isSameDay, plural } from "./calendar.js";

/* Draws the current month as a PNG for "Download as Image".
   This is a separate drawing of the page (canvas, not HTML), so a visual change
   on the page may need a matching change here. Colours come from theme.js. */

const LOGO_URL = "/brand/eeze-logo-gradient-white.svg";
const PATTERN_URL = "/brand/eeze-pattern-overlay-white.svg";

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// Shorten text with "…" until it fits.
function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // the image still renders without it
    img.src = src;
  });

export async function renderCalendarPNG({ year, month, cells, byDay, today, activeRegions, query, eventCount }) {
  const [logo, pattern] = await Promise.all([loadImage(LOGO_URL), loadImage(PATTERN_URL)]);

  const W = 1600;
  const M = 56;
  const GAP = 12;
  const rows = cells.length / 7;
  const cellW = (W - 2 * M - 6 * GAP) / 7;
  const cellH = 212;
  const headerH = 230;
  const weekTop = headerH + 36;
  const gridTop = weekTop + 50;
  const gridH = rows * cellH + (rows - 1) * GAP;
  const H = gridTop + gridH + 140;
  const scale = 2;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";

  // Page
  ctx.fillStyle = BRAND["blue-tint"];
  ctx.fillRect(0, 0, W, H);

  // Header band with the bolt pattern
  ctx.save();
  roundRectPath(ctx, 24, 24, W - 48, headerH - 24, 28);
  const grad = ctx.createLinearGradient(0, 24, 0, headerH);
  grad.addColorStop(0, BRAND["dark-blue"]);
  grad.addColorStop(1, BRAND["deep-navy"]);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.clip();
  if (pattern) {
    // One copy covering the band: the SVG doesn't tile seamlessly
    const pw = W - 48;
    ctx.drawImage(pattern, 24, 24, pw, (pattern.height / pattern.width) * pw);
  }
  ctx.restore();

  if (logo) {
    const lh = 34;
    ctx.drawImage(logo, M, 56, (logo.width / logo.height) * lh, lh);
  }

  // "BEYOND BORDERS." with the neon-yellow dot, top right
  ctx.font = `700 22px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillStyle = BRAND["neon-yellow"];
  ctx.fillText(".", W - M, 84);
  ctx.fillStyle = BRAND.white;
  ctx.fillText("BEYOND BORDERS", W - M - ctx.measureText(".").width, 84);

  ctx.textAlign = "left";
  ctx.font = `700 72px ${FONT}`;
  ctx.fillStyle = BRAND.white;
  ctx.fillText(`${MONTHS[month]} ${year}`.toUpperCase(), M, 180);

  ctx.textAlign = "right";
  ctx.fillStyle = BRAND["light-blue"];
  ctx.font = `700 20px ${FONT}`;
  ctx.fillText(plural(eventCount, "event"), W - M, 178);
  ctx.textAlign = "left";

  // Weekday header
  WEEKDAYS.forEach((d, i) => {
    const x = M + i * (cellW + GAP);
    ctx.fillStyle = BRAND.purple;
    roundRectPath(ctx, x, weekTop, cellW, 36, 18);
    ctx.fill();
    ctx.fillStyle = BRAND.white;
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(d.toUpperCase(), x + cellW / 2, weekTop + 24);
  });
  ctx.textAlign = "left";

  // Days
  cells.forEach((cell, i) => {
    const x = M + (i % 7) * (cellW + GAP);
    const y = gridTop + Math.floor(i / 7) * (cellH + GAP);
    const evs = cell.inMonth ? byDay.get(cell.day) || [] : [];
    const isToday = cell.inMonth && isSameDay(cell, today);

    ctx.save();
    if (cell.inMonth) {
      ctx.shadowColor = ink(0.1);
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
    }
    ctx.fillStyle = !cell.inMonth ? ink(0.04) : evs.length ? REGIONS[evs[0].region].tint : BRAND.white;
    roundRectPath(ctx, x, y, cellW, cellH, 18);
    ctx.fill();
    ctx.restore();

    if (isToday) {
      ctx.strokeStyle = BRAND["dark-blue"];
      ctx.lineWidth = 3;
      roundRectPath(ctx, x + 1.5, y + 1.5, cellW - 3, cellH - 3, 17);
      ctx.stroke();
      ctx.fillStyle = BRAND["dark-blue"];
      roundRectPath(ctx, x + cellW - 74, y + 16, 60, 24, 12);
      ctx.fill();
      ctx.fillStyle = BRAND.white;
      ctx.font = `700 11px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("TODAY", x + cellW - 44, y + 32);
      ctx.textAlign = "left";
    }

    ctx.fillStyle = cell.inMonth ? BRAND["dark-blue"] : ink(0.25);
    ctx.font = `700 38px ${FONT}`;
    ctx.fillText(String(cell.day), x + 16, y + 50);

    evs.slice(0, MAX_EVENTS_PER_DAY).forEach((ev, j) => {
      const r = REGIONS[ev.region];
      const by = y + 66 + j * 38;
      ctx.fillStyle = r.color;
      roundRectPath(ctx, x + 10, by, cellW - 20, 32, 9);
      ctx.fill();
      ctx.fillStyle = r.text;
      ctx.font = `700 15px ${FONT}`;
      ctx.fillText(fitText(ctx, `${ev.flag} ${ev.title}`, cellW - 40), x + 20, by + 21);
    });

    if (evs.length > MAX_EVENTS_PER_DAY) {
      ctx.fillStyle = BRAND["dark-blue"];
      ctx.font = `700 14px ${FONT}`;
      ctx.fillText(`+${evs.length - MAX_EVENTS_PER_DAY} more`, x + 14, y + 66 + MAX_EVENTS_PER_DAY * 38 + 14);
    }
  });

  // Legend
  const ly = gridTop + gridH + 50;
  let lx = M;
  ctx.font = `700 16px ${FONT}`;
  REGION_ORDER.forEach((key) => {
    const r = REGIONS[key];
    ctx.globalAlpha = activeRegions.has(key) ? 1 : 0.3;
    ctx.fillStyle = r.color;
    roundRectPath(ctx, lx, ly - 14, 18, 18, 5);
    ctx.fill();
    ctx.fillStyle = BRAND["dark-blue"];
    ctx.fillText(r.label, lx + 26, ly);
    lx += 26 + ctx.measureText(r.label).width + 32;
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = ink(0.65);
  ctx.font = `400 14px ${FONT}`;
  const note = `${query ? `Filtered by "${query}" · ` : ""}Lunar and lunisolar festival dates are approximate and may vary by region.`;
  ctx.fillText(note, M, ly + 40);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
