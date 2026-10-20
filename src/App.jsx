import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import Header from "./components/Header.jsx";
import SearchBox from "./components/SearchBox.jsx";
import RegionFilters from "./components/RegionFilters.jsx";
import CalendarGrid from "./components/CalendarGrid.jsx";
import DayModal from "./components/DayModal.jsx";
import EventModal from "./components/EventModal.jsx";
import { REGIONS, REGION_ORDER } from "./data/regions.js";
import { LUNAR_YEARS } from "./data/lunarDates.js";
import { buildGrid, eventsForYear } from "./lib/calendar.js";
import { renderCalendarPNG } from "./lib/exportImage.js";

// How many years before and after this one the year dropdown offers.
const YEAR_RANGE = 10;

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() }); // month is 0–11
  const [activeRegions, setActiveRegions] = useState(() => new Set(REGION_ORDER));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null); // event shown in the event popup
  const [dayList, setDayList] = useState(null); // { day, events } shown in the day popup
  const [downloading, setDownloading] = useState(false);

  const years = useMemo(() => {
    const base = today.getFullYear();
    return Array.from({ length: YEAR_RANGE * 2 + 1 }, (_, i) => base - YEAR_RANGE + i);
  }, [today]);

  /* ── Which events to show ─────────────────────────────── */

  const yearEvents = useMemo(() => eventsForYear(view.year), [view.year]);
  const q = query.trim().toLowerCase();

  const matchesSearch = useCallback(
    (ev) => !q || [ev.title, ev.place, ev.about, REGIONS[ev.region].label].some((s) => s.toLowerCase().includes(q)),
    [q]
  );
  const matches = useCallback((ev) => activeRegions.has(ev.region) && matchesSearch(ev), [activeRegions, matchesSearch]);

  const monthEvents = useMemo(() => yearEvents.filter((e) => e.month === view.month), [yearEvents, view.month]);
  const visibleEvents = useMemo(() => monthEvents.filter(matches), [monthEvents, matches]);

  const byDay = useMemo(() => {
    const map = new Map();
    visibleEvents.forEach((e) => {
      if (!map.has(e.day)) map.set(e.day, []);
      map.get(e.day).push(e);
    });
    return map;
  }, [visibleEvents]);

  // Counts on the region buttons ignore the region filter itself, so you can see what you'd get.
  const regionCounts = useMemo(() => {
    const counts = Object.fromEntries(REGION_ORDER.map((r) => [r, 0]));
    monthEvents.filter(matchesSearch).forEach((e) => (counts[e.region] += 1));
    return counts;
  }, [monthEvents, matchesSearch]);

  const searchResults = useMemo(() => (q ? yearEvents.filter(matches) : []), [q, yearEvents, matches]);
  const cells = useMemo(() => buildGrid(view.year, view.month), [view]);

  /* ── Actions ──────────────────────────────────────────── */

  const shiftMonth = useCallback((delta) => {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);
  const goToday = () => setView({ year: today.getFullYear(), month: today.getMonth() });

  // ← and → change month, unless a popup is open or you're typing.
  useEffect(() => {
    const onKey = (e) => {
      if (selected || dayList) return;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.key === "ArrowLeft") shiftMonth(-1);
      if (e.key === "ArrowRight") shiftMonth(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, dayList, shiftMonth]);

  const toggleRegion = (region) => {
    setActiveRegions((prev) => {
      const next = new Set(prev);
      next.has(region) ? next.delete(region) : next.add(region);
      return next;
    });
  };
  const showAllRegions = () => setActiveRegions(new Set(REGION_ORDER));
  const resetFilters = () => {
    showAllRegions();
    setQuery("");
  };

  const jumpToEvent = (ev) => {
    setView({ year: ev.year, month: ev.month });
    setSelected(ev);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await renderCalendarPNG({
        year: view.year,
        month: view.month,
        cells,
        byDay,
        today,
        activeRegions,
        query: query.trim(),
        eventCount: visibleEvents.length,
      });
      if (!blob) throw new Error("Could not render image");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `beyond-borders-${view.year}-${String(view.month + 1).padStart(2, "0")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      console.error(err);
      alert("Sorry — the image could not be generated in this browser.");
    } finally {
      setDownloading(false);
    }
  };

  const lunarOutOfRange = view.year < LUNAR_YEARS.first || view.year > LUNAR_YEARS.last;
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();

  /* ── Page ─────────────────────────────────────────────── */

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
        <Header
          view={view}
          setView={setView}
          years={years}
          eventCount={visibleEvents.length}
          isCurrentMonth={isCurrentMonth}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onToday={goToday}
          onDownload={handleDownload}
          downloading={downloading}
        />

        <section className="relative z-20 mt-4 flex flex-col gap-3 rounded-[24px] bg-white p-3 shadow-lg shadow-eeze-dark-blue/5 md:flex-row md:items-center md:p-4">
          <SearchBox query={query} setQuery={setQuery} results={searchResults} year={view.year} onPick={jumpToEvent} />
          <RegionFilters active={activeRegions} counts={regionCounts} onToggle={toggleRegion} onAll={showAllRegions} />
        </section>

        {(lunarOutOfRange || visibleEvents.length === 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-md shadow-eeze-dark-blue/5">
            <Sparkles size={16} className="shrink-0 text-eeze-purple" />
            {visibleEvents.length === 0 ? (
              <>
                <span>No events match your filters this month.</span>
                <button onClick={resetFilters} className="font-bold underline underline-offset-4">
                  Reset filters
                </button>
              </>
            ) : (
              <span>
                Lunar and lunisolar festivals (Diwali, Eid, Lunar New Year and others) are only listed for {LUNAR_YEARS.first}–
                {LUNAR_YEARS.last}. Fixed-date and rule-based holidays show for every year.
              </span>
            )}
          </div>
        )}

        <main className="mt-5">
          <CalendarGrid
            cells={cells}
            byDay={byDay}
            today={today}
            onPickEvent={setSelected}
            onOpenDay={(day, events) => setDayList({ day, events })}
          />
        </main>

        <footer className="mt-6 flex flex-col gap-3 text-xs text-eeze-dark-blue/65 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {REGION_ORDER.map((key) => (
              <span key={key} className="flex items-center gap-1.5" style={{ opacity: activeRegions.has(key) ? 1 : 0.35 }}>
                <span className="h-3 w-3 rounded-[4px]" style={{ background: REGIONS[key].color }} />
                {REGIONS[key].label}
              </span>
            ))}
          </div>
          <p>Tip: use ← → to change month. Lunar festival dates are approximate and can differ by a day between regions.</p>
        </footer>
      </div>

      {dayList && !selected && (
        <DayModal
          day={dayList.day}
          month={view.month}
          year={view.year}
          events={dayList.events}
          onPick={setSelected}
          onClose={() => setDayList(null)}
        />
      )}
      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
