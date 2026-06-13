import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { SUBWAY_FEEDS, ROUTE_TO_FEED, DEFAULT_SUBWAY_STOP } from "@/lib/config";

// GET /api/subway?stop=R03S
// Returns the next arrivals at a given stop, soonest first.
// stop is a GTFS stop_id WITH direction suffix (N = north/Ditmars, S = south/Manhattan).
export const dynamic = "force-dynamic"; // never cache at the framework level

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const stopId = searchParams.get("stop") || DEFAULT_SUBWAY_STOP;

  // Which direction suffix? Determines parent stop + which arrivals to keep.
  const parentStop = stopId.replace(/[NS]$/, "");

  // Figure out which feed(s) to pull. If the caller passes ?lines=N,W we use those;
  // otherwise we pull every feed that could serve this stop. For your default
  // (R03S, the N/W) that's just the nqrw feed.
  const linesParam = searchParams.get("lines");
  let feedKeys;
  if (linesParam) {
    feedKeys = [...new Set(linesParam.split(",").map((l) => ROUTE_TO_FEED[l.trim().toUpperCase()]).filter(Boolean))];
  } else {
    // Default: just the N/Q/R/W feed (covers Astoria Blvd). Expand if you add stops.
    feedKeys = ["nqrw"];
  }

  try {
    const now = Date.now();
    const arrivals = [];

    await Promise.all(
      feedKeys.map(async (key) => {
        const res = await fetch(SUBWAY_FEEDS[key], { cache: "no-store" });
        if (!res.ok) throw new Error(`feed ${key} returned ${res.status}`);
        const buffer = await res.arrayBuffer();
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
          new Uint8Array(buffer)
        );

        for (const entity of feed.entity) {
          if (!entity.tripUpdate) continue;
          const routeId = entity.tripUpdate.trip?.routeId || "?";
          for (const stu of entity.tripUpdate.stopTimeUpdate || []) {
            // stopId in the feed already includes the N/S direction suffix.
            if (stu.stopId !== stopId) continue;
            const t = stu.arrival?.time ?? stu.departure?.time;
            if (t == null) continue;
            const epochMs = Number(t) * 1000;
            const minutesAway = Math.round((epochMs - now) / 60000);
            if (minutesAway < 0) continue; // already left
            arrivals.push({
              line: routeId,
              minutesAway,
              arrivalEpoch: epochMs,
            });
          }
        }
      })
    );

    arrivals.sort((a, b) => a.arrivalEpoch - b.arrivalEpoch);

    return NextResponse.json(
      {
        stop: stopId,
        parentStop,
        updated: new Date(now).toISOString(),
        arrivals: arrivals.slice(0, 6),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch subway feed", detail: String(err) },
      { status: 502 }
    );
  }
}
