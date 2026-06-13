import { NextResponse } from "next/server";

// GET /api/sign — returns both default stops in one call for the LED sign.
export const dynamic = "force-dynamic";

export async function GET(request) {
  const origin = new URL(request.url).origin;

  try {
    const [subwayRes, busRes] = await Promise.all([
      fetch(`${origin}/api/subway`, { cache: "no-store" }),
      fetch(`${origin}/api/bus`, { cache: "no-store" }),
    ]);

    const [subway, bus] = await Promise.all([subwayRes.json(), busRes.json()]);

    return NextResponse.json(
      { subway, bus },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch sign data", detail: String(err) },
      { status: 502 }
    );
  }
}
