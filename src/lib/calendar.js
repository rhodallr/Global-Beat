import { EVENTS } from "../data/events.js";
import { REGION_ORDER } from "../data/regions.js";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// How many event labels fit in a day before "+X more" appears.
export const MAX_EVENTS_PER_DAY = 3;

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const wikipediaUrl = (page) => `https://en.wikipedia.org/wiki/${encodeURIComponent(page.replace(/ /g, "_"))}`;

const resolveDate = (date, year) => {
  if (typeof date !== "string") return date(year);
  const [month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// Every event that falls in `year`, with its actual date, sorted by date then region.
export function eventsForYear(year) {
  const out = [];
  EVENTS.forEach((ev, i) => {
    const d = resolveDate(ev.date, year);
    if (!d || d.getFullYear() !== year) return;
    out.push({
      ...ev,
      key: `${slugify(ev.title)}-${slugify(ev.place)}-${i}-${year}`,
      movable: typeof ev.date !== "string",
      learnMoreUrl: wikipediaUrl(ev.wikipedia),
      year,
      month: d.getMonth(), // 0–11
      day: d.getDate(),
    });
  });
  const regionRank = (e) => REGION_ORDER.indexOf(e.region);
  return out.sort(
    (a, b) => a.month - b.month || a.day - b.day || regionRank(a) - regionRank(b) || a.title.localeCompare(b.title)
  );
}

// The days shown in a month view: whole Monday-to-Sunday weeks, including
// the end of the previous month and the start of the next.
export function buildGrid(year, month) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = Math.ceil((lead + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(year, month, 1 - lead + i);
    return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), inMonth: d.getMonth() === month };
  });
}

export const weekdayName = (year, month, day) => WEEKDAYS_LONG[(new Date(year, month, day).getDay() + 6) % 7];

// e.g. "Tuesday, 20 October 2026"
export const formatDate = (ev) => `${weekdayName(ev.year, ev.month, ev.day)}, ${ev.day} ${MONTHS[ev.month]} ${ev.year}`;

export const isSameDay = (cell, date) =>
  cell.day === date.getDate() && cell.month === date.getMonth() && cell.year === date.getFullYear();

// "1 event", "3 events"
export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
