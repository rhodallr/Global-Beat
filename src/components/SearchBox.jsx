import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { REGIONS } from "../data/regions.js";
import { MONTHS } from "../lib/calendar.js";

const MAX_RESULTS = 10;

// Search box with a dropdown of matching events for the whole year.
export default function SearchBox({ query, setQuery, results, year, onPick }) {
  const [open, setOpen] = useState(false);
  const hasQuery = query.trim() !== "";

  const pick = (ev) => {
    setOpen(false);
    onPick(ev);
  };

  return (
    <div className="relative shrink-0 md:w-80">
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" && results[0]) pick(results[0]);
        }}
        placeholder="Search festivals or countries…"
        aria-label="Search festivals or countries"
        className="h-12 w-full rounded-full bg-eeze-blue-tint pl-11 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-eeze-purple"
      />
      {query && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full hover:bg-eeze-dark-blue/5"
        >
          <X size={15} />
        </button>
      )}

      {open && hasQuery && (
        <div className="fade-in absolute left-0 right-0 top-[calc(100%+8px)] rounded-2xl bg-white p-2 shadow-2xl md:w-[26rem]">
          <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] opacity-60">
            {results.length ? `${results.length} match${results.length === 1 ? "" : "es"} in ${year}` : `No matches in ${year}`}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {results.slice(0, MAX_RESULTS).map((ev) => {
              const region = REGIONS[ev.region];
              return (
                <li key={ev.key}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(ev)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-eeze-blue-tint"
                  >
                    <span
                      className="w-12 shrink-0 rounded-lg py-1 text-center leading-none"
                      style={{ background: region.color, color: region.text }}
                    >
                      <span className="display block text-lg">{ev.day}</span>
                      <span className="block text-[9px] font-bold uppercase tracking-wider">{MONTHS[ev.month].slice(0, 3)}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">
                        <span aria-hidden className="mr-1">
                          {ev.flag}
                        </span>
                        {ev.title}
                      </span>
                      <span className="block truncate text-xs opacity-60">{ev.place}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
