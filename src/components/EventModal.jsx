import React from "react";
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import Modal, { CloseButton } from "./Modal.jsx";
import { REGIONS } from "../data/regions.js";
import { MONTHS, formatDate } from "../lib/calendar.js";

// Details of one event, opened by clicking its label.
export default function EventModal({ event, onClose }) {
  const region = REGIONS[event.region];
  return (
    <Modal onClose={onClose} labelledBy="event-title">
      <div className="relative px-6 pb-7 pt-6" style={{ background: region.color, color: region.text }}>
        <CloseButton onClick={onClose} color={region.text} />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-eeze-dark-blue">
          <span className="h-2 w-2 rounded-full" style={{ background: region.color }} />
          {region.label}
        </span>
        <div className="mt-5 flex items-end gap-4">
          <div className="display text-7xl leading-[0.8]">{event.day}</div>
          <div className="pb-1 text-sm font-bold uppercase tracking-[0.14em] opacity-90">
            {MONTHS[event.month]}
            <br />
            {event.year}
          </div>
          <div className="ml-auto text-5xl leading-none" aria-hidden>
            {event.flag}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-6">
        <h2 id="event-title" className="display text-3xl">
          {event.title}
        </h2>
        <div className="mt-4 space-y-2 text-sm text-eeze-dark-blue/75">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0" />
            <span>
              <span className="mr-1" aria-hidden>
                {event.flag}
              </span>
              {event.place}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="shrink-0" />
            <span>{formatDate(event)}</span>
          </div>
        </div>
        <p className="mt-5 text-[15px] leading-relaxed">{event.about}</p>
        {event.movable && (
          <p className="mt-4 rounded-2xl px-4 py-3 text-xs leading-relaxed ring-1 ring-eeze-dark-blue/10" style={{ background: region.tint }}>
            This date moves each year. Festivals that follow a lunar or lunisolar calendar can also differ by a day between
            countries.
          </p>
        )}
        <a
          href={event.learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-eeze-dark-blue px-5 py-4 text-base font-bold text-white transition hover:-translate-y-0.5 hover:bg-eeze-purple hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-eeze-purple/40"
        >
          Explore Full Story <ExternalLink size={18} />
        </a>
      </div>
    </Modal>
  );
}
