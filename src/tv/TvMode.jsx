import React, { useEffect, useMemo, useState } from "react";
import { BRAND, ink } from "../theme.js";
import { REGIONS, REGION_ORDER } from "../data/regions.js";
import { MONTHS, WEEKDAYS, buildGrid, eventsForYear, formatDate, isSameDay, plural, weekdayName } from "../lib/calendar.js";

/* ──────────────────────────────────────────────────────────────────────────
   TV mode — open the site with ?tv (e.g. https://…/?tv).
   One full 16:9 screen, no mouse or keyboard needed:
   the month grid on the left, today's events and what's coming up on the right.
   It follows the clock by itself and reloads every night to pick up updates.
   ────────────────────────────────────────────────────────────────────────── */

const SPOTLIGHT_SECONDS = 15; // time each of today's events stays on screen
const COMING_UP_COUNT = 4;
const EVENTS_PER_DAY = 2; // labels per day before "+N"
const RELOAD_HOUR = 4; // nightly reload at 04:00

// Everything is sized in rem, and 1rem is scaled to the screen: 20px on a 1080p TV.
const SCREEN_FONT_SIZE = "min(1.852vh, 1.042vw)";

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const eventDate = (ev) => new Date(ev.year, ev.month, ev.day);
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);

// The current time, refreshed every minute, so the screen moves on at midnight.
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Reload once a night so every TV picks up new events and fixes.
function useNightlyReload() {
  useEffect(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), RELOAD_HOUR);
    if (next <= now) next.setDate(next.getDate() + 1);
    const id = setTimeout(() => window.location.reload(), next - now);
    return () => clearTimeout(id);
  }, []);
}

// Scale the page to the screen and hide the cursor while TV mode is showing.
function useScreenSetup() {
  useEffect(() => {
    const root = document.documentElement;
    const prev = { fontSize: root.style.fontSize, cursor: root.style.cursor, overflow: root.style.overflow };
    root.style.fontSize = SCREEN_FONT_SIZE;
    root.style.cursor = "none";
    root.style.overflow = "hidden";
    return () => Object.assign(root.style, prev);
  }, []);
}

export default function TvMode() {
  useScreenSetup();
  useNightlyReload();
  const now = useNow();
  const today = startOfDay(now);
  const year = today.getFullYear();
  const month = today.getMonth();

  // This year and next, so "Coming up" works across New Year.
  const events = useMemo(() => [...eventsForYear(year), ...eventsForYear(year + 1)], [year]);

  const byDay = useMemo(() => {
    const map = new Map();
    events
      .filter((e) => e.year === year && e.month === month)
      .forEach((e) => {
        if (!map.has(e.day)) map.set(e.day, []);
        map.get(e.day).push(e);
      });
    return map;
  }, [events, year, month]);

  const todays = byDay.get(today.getDate()) || [];
  const upcoming = events.filter((e) => eventDate(e) > today).slice(0, COMING_UP_COUNT);

  return (
    <div className="flex h-screen w-screen flex-col gap-5 overflow-hidden bg-eeze-blue-tint p-8 text-eeze-dark-blue">
      <header className="bolt-texture flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-eeze-dark-blue to-eeze-deep-navy px-8 py-5 text-white">
        <div className="flex items-center gap-8">
          <img src="/brand/eeze-logo-gradient-white.svg" alt="eeze" className="h-10" />
          <h1 className="display text-5xl">
            {MONTHS[month]} <span className="text-eeze-light-blue">{year}</span>
          </h1>
        </div>
        <span className="display text-3xl">
          Beyond Borders<span className="text-eeze-neon-yellow">.</span>
        </span>
      </header>

      <main className="flex min-h-0 flex-1 gap-5">
        <MonthGrid year={year} month={month} byDay={byDay} today={today} />
        <aside className="flex w-[27%] shrink-0 flex-col gap-5">
          <Spotlight todays={todays} next={upcoming[0]} today={today} />
          <ComingUp events={todays.length ? upcoming : upcoming.slice(1)} today={today} />
        </aside>
      </main>

      <footer className="flex items-center gap-8 text-lg font-bold">
        {REGION_ORDER.map((key) => (
          <span key={key} className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-md" style={{ background: REGIONS[key].color, boxShadow: `inset 0 0 0 1px ${ink(0.15)}` }} />
            {REGIONS[key].label}
          </span>
        ))}
      </footer>
    </div>
  );
}

function MonthGrid({ year, month, byDay, today }) {
  const cells = buildGrid(year, month);
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="rounded-full bg-eeze-purple py-1.5 text-center text-base font-bold uppercase tracking-widest text-white">
            {d}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 gap-2" style={{ gridTemplateRows: `repeat(${cells.length / 7}, minmax(0, 1fr))` }}>
        {cells.map((cell) => {
          const key = `${cell.year}-${cell.month}-${cell.day}`;
          if (!cell.inMonth) {
            return (
              <div key={key} className="rounded-2xl bg-eeze-dark-blue/[0.04] p-3">
                <span className="display text-2xl text-eeze-dark-blue/20">{cell.day}</span>
              </div>
            );
          }
          const evs = byDay.get(cell.day) || [];
          const isToday = isSameDay(cell, today);
          const isPast = cell.day < today.getDate();
          return (
            <div
              key={key}
              className={`flex min-h-0 flex-col gap-1.5 overflow-hidden rounded-2xl p-2.5 ${isPast ? "opacity-60" : ""}`}
              style={{
                background: evs.length ? REGIONS[evs[0].region].tint : BRAND.white,
                boxShadow: isToday ? `0 0 0 4px ${BRAND["dark-blue"]}` : `0 6px 18px -14px ${ink(0.4)}`,
              }}
            >
              <div className="flex items-start justify-between">
                <span className="display text-3xl">{cell.day}</span>
                {isToday && (
                  <span className="rounded-full bg-eeze-dark-blue px-2.5 py-0.5 text-sm font-bold uppercase tracking-wider text-white">
                    Today
                  </span>
                )}
              </div>
              {evs.slice(0, EVENTS_PER_DAY).map((ev) => (
                <div
                  key={ev.key}
                  className="shrink-0 truncate rounded-lg px-1.5 py-1 text-[0.85rem] font-bold leading-tight"
                  style={{ background: REGIONS[ev.region].color, color: REGIONS[ev.region].text }}
                >
                  {ev.flag} {ev.title}
                </div>
              ))}
              {evs.length > EVENTS_PER_DAY && <div className="shrink-0 px-1 text-sm font-bold">+{evs.length - EVENTS_PER_DAY} more</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Today's events one at a time, or the next event when today has none.
function Spotlight({ todays, next, today }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (todays.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % todays.length), SPOTLIGHT_SECONDS * 1000);
    return () => clearInterval(id);
  }, [todays]);

  const ev = todays.length ? todays[index % todays.length] : next;
  if (!ev) return null;

  const region = REGIONS[ev.region];
  const daysAway = daysBetween(today, eventDate(ev));
  const label = todays.length
    ? `Today · ${weekdayName(today.getFullYear(), today.getMonth(), today.getDate())} ${today.getDate()} ${MONTHS[today.getMonth()]}`
    : `Next up · ${daysAway === 1 ? "tomorrow" : `in ${daysAway} days`}`;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-eeze-dark-blue/10">
      <div key={ev.key} className="fade-in flex min-h-0 flex-1 flex-col">
        <div className="px-7 pb-5 pt-5" style={{ background: region.color, color: region.text }}>
          <div className="flex items-center justify-between text-base font-bold uppercase tracking-[0.14em]">
            <span>{label}</span>
            {todays.length > 1 && (
              <span>
                {index + 1} / {todays.length}
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-5xl leading-none">{ev.flag}</span>
            <h2 className="display text-4xl">{ev.title}</h2>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 px-7 py-5">
          <div className="text-lg font-bold">{ev.place}</div>
          {!todays.length && <div className="text-base opacity-70">{formatDate(ev)}</div>}
          <p className="line-clamp-5 text-lg leading-snug">{ev.about}</p>
          <span className="mt-auto inline-flex self-start rounded-full px-3 py-1 text-sm font-bold" style={{ background: region.tint, boxShadow: `inset 0 0 0 1px ${ink(0.1)}` }}>
            {region.label}
          </span>
        </div>
      </div>
    </section>
  );
}

function ComingUp({ events, today }) {
  if (!events.length) return null;
  return (
    <section className="rounded-3xl bg-white px-7 py-5 shadow-lg shadow-eeze-dark-blue/10">
      <h3 className="display text-xl">Coming up</h3>
      <ul className="mt-3 space-y-2">
        {events.map((ev) => {
          const days = daysBetween(today, eventDate(ev));
          return (
            <li key={ev.key} className="flex items-center gap-3 text-lg">
              <span
                className="w-12 shrink-0 rounded-lg py-1 text-center leading-none"
                style={{ background: REGIONS[ev.region].color, color: REGIONS[ev.region].text }}
              >
                <span className="display block text-xl">{ev.day}</span>
                <span className="block text-xs font-bold uppercase">{MONTHS[ev.month].slice(0, 3)}</span>
              </span>
              <span className="min-w-0 flex-1 truncate font-bold">
                {ev.flag} {ev.title}
              </span>
              <span className="shrink-0 text-base opacity-60">{days === 1 ? "tomorrow" : `in ${plural(days, "day")}`}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
