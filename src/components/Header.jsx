import React from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { MONTHS, plural } from "../lib/calendar.js";

const roundButton = "flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15";
const select =
  "header-select h-12 rounded-full bg-white/10 pl-4 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-eeze-light-blue";

// Dark brand header: logo, title, month name and the month controls.
export default function Header({ view, setView, years, eventCount, isCurrentMonth, onPrev, onNext, onToday, onDownload, downloading }) {
  return (
    <header className="bolt-texture relative overflow-hidden rounded-[28px] bg-gradient-to-b from-eeze-dark-blue to-eeze-deep-navy px-5 py-6 text-white shadow-xl md:px-8 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <img src="/brand/eeze-logo-gradient-white.svg" alt="eeze" className="h-7 md:h-8" />
        <span className="display text-right text-sm md:text-lg">
          Beyond Borders<span className="text-eeze-neon-yellow">.</span>
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="display text-6xl md:text-8xl">{MONTHS[view.month]}</span>
            <span className="display text-4xl text-eeze-light-blue md:text-6xl">{view.year}</span>
          </h1>
          <p className="mt-4 text-sm opacity-75">
            {plural(eventCount, "festival & holiday", "festivals & holidays")} from around the world this month
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
            <button onClick={onPrev} aria-label="Previous month" className={roundButton}>
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={onToday}
              disabled={isCurrentMonth}
              className="h-10 rounded-full px-4 text-sm font-bold transition hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Today
            </button>
            <button onClick={onNext} aria-label="Next month" className={roundButton}>
              <ChevronRight size={20} />
            </button>
          </div>

          <label className="sr-only" htmlFor="month-select">
            Month
          </label>
          <select
            id="month-select"
            value={view.month}
            onChange={(e) => setView((v) => ({ ...v, month: Number(e.target.value) }))}
            className={select}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="year-select">
            Year
          </label>
          <select
            id="year-select"
            value={view.year}
            onChange={(e) => setView((v) => ({ ...v, year: Number(e.target.value) }))}
            className={select}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-eeze-dark-blue transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70"
          >
            {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {downloading ? "Rendering…" : "Download as Image"}
          </button>
        </div>
      </div>
    </header>
  );
}
