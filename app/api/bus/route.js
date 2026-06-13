import { NextResponse } from "next/server";
import { DEFAULT_BUS_STOP, DEFAULT_BUS_LINE } from "@/lib/config";

const SIRI_BASE = "https://bustime.mta.info/api/siri/stop-monitoring.json";

// GET /api/bus?stop=<MonitoringRef>&line=<SIRI LineRef>
// Defaults to westbound M60 SBS at Hoyt Av/31 St (set M60_STOP_ID in .env.local).
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const stopRef = searchParams.get("stop") || DEFAULT_BUS_STOP;
  const lineRef = searchParams.get("line") || DEFAULT_BUS_LINE;
  const key = process.env.MTA_BUS_KEY;

  if (!key) {
    return NextResponse.json({ error: "MTA_BUS_KEY not configured" }, { status: 500 });
  }
  if (!stopRef) {
    return NextResponse.json(
      { error: "M60_STOP_ID not set in env and no ?stop= provided" },
      { status: 500 }
    );
  }

  const url = new URL(SIRI_BASE);
  url.searchParams.set("key", key);
  url.searchParams.set("MonitoringRef", stopRef);
  url.searchParams.set("LineRef", lineRef);
  url.searchParams.set("MaximumStopVisits", "6");

  try {
    const now = Date.now();
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`Bus Time returned ${res.status}`);
    const data = await res.json();

    const visits =
      data?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]
        ?.MonitoredStopVisit || [];

    const arrivals = visits
      .map((v) => {
        const mvj = v.MonitoredVehicleJourney;
        const call = mvj?.MonitoredCall;
        const expectedArrival = call?.ExpectedArrivalTime;
        const minutesAway = expectedArrival
          ? Math.round((new Date(expectedArrival).getTime() - now) / 60000)
          : null;
        return {
          line: mvj?.PublishedLineName || lineRef,
          destination: mvj?.DestinationName,
          presentableDistance: call?.Extensions?.Distances?.PresentableDistance,
          minutesAway,
        };
      })
      .filter((a) => a.minutesAway === null || a.minutesAway >= 0);

    return NextResponse.json(
      {
        stop: stopRef,
        line: lineRef,
        updated: new Date(now).toISOString(),
        arrivals,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch bus feed", detail: String(err) },
      { status: 502 }
    );
  }
}
