import React from "react";
import { BRAND, ink } from "../theme.js";
import { REGIONS } from "../data/regions.js";
import { MAX_EVENTS_PER_DAY, MONTHS, WEEKDAYS, isSameDay, plural } from "../lib/calendar.js";

const dayHeight = "min-h-[96px] md:min-h-[136px] lg:min-h-[156px]";

// The month grid: weekday headings, then one box per day.
export default function CalendarGrid({ cells, byDay, today, onPickEvent, onOpenDay }) {
  return (
    <div className="grid grid-cols-7 gap-1.5 md:gap-3">
      {WEEKDAYS.map((d) => (
        <div
          key={d}
          className="rounded-full bg-eeze-purple py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white md:text-xs"
        >
          <span className="md:hidden">{d.slice(0, 1)}</span>
          <span className="hidden md:inline">{d}</span>
        </div>
      ))}

      {cells.map((cell) => {
        const key = `${cell.year}-${cell.month}-${cell.day}`;
        if (!cell.inMonth) {
          return (
            <div key={key} className={`${dayHeight} rounded-xl bg-eeze-dark-blue/[0.04] p-2 md:rounded-2xl md:p-3`} aria-hidden>
              <span className="display text-xl text-eeze-dark-blue/20 md:text-3xl">{cell.day}</span>
            </div>
          );
        }
        return (
          <Day
            key={key}
            cell={cell}
            events={byDay.get(cell.day) || []}
            isToday={isSameDay(cell, today)}
            onPickEvent={onPickEvent}
            onOpenDay={onOpenDay}
          />
        );
      })}
    </div>
  );
}

function Day({ cell, events, isToday, onPickEvent, onOpenDay }) {
  const hasEvents = events.length > 0;
  const hidden = events.length - MAX_EVENTS_PER_DAY;
  const openDay = () => hasEvents && onOpenDay(cell.day, events);
  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    openDay();
  };

  return (
    <div
      onClick={openDay}
      onKeyDown={onKeyDown}
      role={hasEvents ? "button" : undefined}
      tabIndex={hasEvents ? 0 : undefined}
      aria-label={`${cell.day} ${MONTHS[cell.month]}, ${plural(events.length, "event")}`}
      className={`${dayHeight} relative flex flex-col rounded-xl p-1.5 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-eeze-purple/50 md:rounded-2xl md:p-2.5 ${
        hasEvents ? "cursor-pointer hover:-translate-y-0.5" : ""
      }`}
      style={{
        background: hasEvents ? REGIONS[events[0].region].tint : BRAND.white,
        boxShadow: isToday
          ? `0 0 0 3px ${BRAND["dark-blue"]}, 0 14px 30px -16px ${ink(0.5)}`
          : `0 8px 22px -16px ${ink(0.35)}`,
      }}
    >
      <div className="flex items-start justify-between gap-1 px-0.5">
        <span className="display text-xl md:text-3xl lg:text-4xl">{cell.day}</span>
        {isToday && (
          <span className="rounded-full bg-eeze-dark-blue px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white md:px-2 md:text-[10px]">
            Today
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-col gap-1 md:mt-2.5">
        {events.slice(0, MAX_EVENTS_PER_DAY).map((ev) => (
          <EventLabel key={ev.key} event={ev} onClick={onPickEvent} />
        ))}
        {hidden > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDay();
            }}
            className="self-start rounded-md px-1.5 py-0.5 text-[11px] font-bold transition hover:bg-eeze-dark-blue/10 md:text-xs"
          >
            +{hidden} more
          </button>
        )}
      </div>
    </div>
  );
}

function EventLabel({ event, onClick }) {
  const region = REGIONS[event.region];
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      title={`${event.title} — ${event.place}`}
      className="flex w-full items-center gap-1 rounded-lg px-1.5 py-1 text-left text-[11px] font-bold leading-tight transition hover:-translate-y-px hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-eeze-dark-blue focus-visible:ring-offset-1 md:px-2 md:text-xs"
      style={{ background: region.color, color: region.text }}
    >
      <span className="shrink-0" aria-hidden>
        {event.flag}
      </span>
      <span className="truncate">{event.title}</span>
    </button>
  );
}
