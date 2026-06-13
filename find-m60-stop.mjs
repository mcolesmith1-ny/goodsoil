#!/usr/bin/env node
/**
 * One-time helper: finds the MTA Bus Time stop ID (MonitoringRef) for
 * HOYT AV/31 ST on the M60 SBS, westbound toward Manhattan.
 *
 * Usage: MTA_BUS_KEY=your_key node find-m60-stop.mjs
 *
 * Copy the numeric ID from the output into .env.local as M60_STOP_ID.
 */

const key = process.env.MTA_BUS_KEY;
if (!key) {
  console.error("Usage: MTA_BUS_KEY=your_key node find-m60-stop.mjs");
  process.exit(1);
}

// Hoyt Ave & 31 St, Astoria — approximate coordinates
const lat = 40.757;
const lon = -73.928;
const span = 0.003;

const url =
  `https://bustime.mta.info/api/where/stops-for-location.json` +
  `?key=${encodeURIComponent(key)}&lat=${lat}&lon=${lon}` +
  `&latSpan=${span}&lonSpan=${span}`;

const res = await fetch(url);
if (!res.ok) {
  console.error(`API returned ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const stops = data?.data?.list || [];

const m60 = stops.filter((s) =>
  s.routes?.some((r) => r.id?.toUpperCase().includes("M60"))
);

if (m60.length === 0) {
  console.log("No M60 stops found near Hoyt Av/31 St. All stops in the area:\n");
  for (const s of stops) {
    const routes = s.routes?.map((r) => r.shortName).join(", ") || "—";
    console.log(`  ${String(s.id).padEnd(24)} ${s.name}  [${routes}]`);
  }
} else {
  console.log("M60 stops near Hoyt Av/31 St:\n");
  for (const s of m60) {
    // The numeric MonitoringRef is the part after the last underscore
    const monitoringRef = s.id.replace(/^.*_/, "");
    console.log(`  Stop ID (full):     ${s.id}`);
    console.log(`  MonitoringRef:      ${monitoringRef}   ← use this as M60_STOP_ID`);
    console.log(`  Name:               ${s.name}`);
    console.log(`  Direction:          ${s.direction}`);
    console.log();
  }
  console.log("Add the MonitoringRef value to .env.local:");
  console.log("  M60_STOP_ID=<the number above>");
}
