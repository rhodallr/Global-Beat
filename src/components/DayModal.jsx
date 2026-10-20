import React from "react";
import { ChevronRight } from "lucide-react";
import Modal, { CloseButton } from "./Modal.jsx";
import { REGIONS } from "../data/regions.js";
import { MONTHS, plural, weekdayName } from "../lib/calendar.js";

// Every event on one day, opened by clicking a day or "+X more".
export default function DayModal({ day, month, year, events, onPick, onClose }) {
  return (
    <Modal onClose={onClose} labelledBy="day-title">
      <div className="bolt-texture relative bg-eeze-dark-blue px-6 pb-5 pt-6 text-white">
        <CloseButton onClick={onClose} color="white" />
        <div className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{weekdayName(year, month, day)}</div>
        <h2 id="day-title" className="display mt-1 text-4xl">
          {day} {MONTHS[month]}
        </h2>
        <div className="mt-1 text-sm opacity-70">{plural(events.length, "event")}</div>
      </div>
      <ul className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
        {events.map((ev) => {
          const region = REGIONS[ev.region];
          return (
            <li key={ev.key}>
              <button
                onClick={() => onPick(ev)}
                className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ring-eeze-dark-blue/10 transition hover:-translate-y-0.5"
                style={{ background: region.tint }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: region.color }}
                  aria-hidden
                >
                  {ev.flag}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{ev.title}</span>
                  <span className="block truncate text-xs text-eeze-dark-blue/65">
                    {ev.place} · {region.label}
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0 opacity-50 transition group-hover:translate-x-0.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
