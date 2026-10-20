import React from "react";
import { REGIONS, REGION_ORDER } from "../data/regions.js";

// "All" plus one on/off button per region, each with this month's event count.
export default function RegionFilters({ active, counts, onToggle, onAll }) {
  const allOn = active.size === REGION_ORDER.length;
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by region">
      <button
        onClick={onAll}
        aria-pressed={allOn}
        className={`h-10 rounded-full px-4 text-sm font-bold transition ${
          allOn ? "bg-eeze-dark-blue text-white" : "bg-eeze-blue-tint text-eeze-dark-blue"
        }`}
      >
        All
      </button>
      {REGION_ORDER.map((key) => {
        const region = REGIONS[key];
        const on = active.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            aria-pressed={on}
            className={`flex h-10 items-center gap-2 rounded-full pl-2 pr-3.5 text-sm font-bold transition hover:-translate-y-px ${
              on ? "" : "bg-eeze-blue-tint"
            }`}
            style={on ? { background: region.color, color: region.text } : undefined}
          >
            <span
              className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] ${on ? "bg-white/30" : ""}`}
              style={on ? undefined : { background: region.color, color: region.text, opacity: 0.6 }}
            >
              {counts[key]}
            </span>
            <span className={on ? "" : "text-eeze-dark-blue/55"}>{region.label}</span>
          </button>
        );
      })}
    </div>
  );
}
