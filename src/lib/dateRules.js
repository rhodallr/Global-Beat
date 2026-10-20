/* Rules for holidays that move every year. Each rule returns a function
   (year) => Date, which events.js puts in an event's `date` field.

   Months are 1–12. Weekdays: 0 = Sunday, 1 = Monday … 6 = Saturday. */

// The n-th weekday of a month. n = -1 means the last one.
// Example: nthWeekday(11, 4, 4) = 4th Thursday of November.
export const nthWeekday = (month, weekday, n) => (year) => {
  if (n > 0) {
    const first = new Date(year, month - 1, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month - 1, 1 + offset + (n - 1) * 7);
  }
  const last = new Date(year, month, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month - 1, last.getDate() - offset);
};

// The first given weekday on or after a date. Example: weekdayOnOrAfter(6, 19, 5) = Friday from 19 June.
export const weekdayOnOrAfter = (month, day, weekday) => (year) => {
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  return d;
};

// The last given weekday on or before a date. Example: weekdayOnOrBefore(5, 24, 1) = Monday up to 24 May.
export const weekdayOnOrBefore = (month, day, weekday) => (year) => {
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() - ((d.getDay() - weekday + 7) % 7));
  return d;
};

// Shift another rule by a number of days. Example: daysAfter(nthWeekday(8, 1, -1), -1) = Sunday before the last Monday of August.
export const daysAfter = (rule, days) => (year) => {
  const d = rule(year);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return d;
};

// Western Easter Sunday (Anonymous Gregorian algorithm, Meeus/Jones/Butcher)
function westernEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Orthodox Easter: Julian computus converted to Gregorian (valid 1900–2099)
function orthodoxEasterDate(year) {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 13);
  return date;
}

// Days relative to Easter Sunday. Example: easter(-47) = Shrove Tuesday.
export const easter = (offset = 0) => daysAfter(westernEaster, offset);
export const orthodoxEaster = () => orthodoxEasterDate;

// A date from one of the tables in lunarDates.js, optionally shifted by some days.
// Returns null for years the table doesn't cover, so the event is skipped.
export const lunar = (table, offset = 0) => (year) => {
  const value = table[year];
  if (!value) return null;
  const [month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day + offset);
};
