import { NextRequest, NextResponse } from "next/server";
import { getMarketOddsHistory } from "@/lib/actions/markets";

/**
 * GET /api/markets/[id]/odds
 *
 * Returns the full odds history for a market, ordered from newest to oldest.
 * Used by the market detail page for the odds chart.
 *
 * Query params:
 *   ?limit=50  (default 50, max 200)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const marketId = Number(id);

  if (!Number.isSafeInteger(marketId) || marketId < 0) {
    return NextResponse.json({ error: "Invalid market ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") ?? "50");
  const limitParam = Number.isSafeInteger(requestedLimit) ? requestedLimit : 50;
  const limit = Math.min(Math.max(1, limitParam), 200);

  try {
    const history = await getMarketOddsHistory(marketId, limit);

    // Return oldest first for charting
    const chronological = [...history].reverse();

    return NextResponse.json(
      { history: chronological, count: chronological.length },
      {
        headers: {
          // Odds data updates on threshold decryption rounds — short cache
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error(`GET /api/markets/${id}/odds error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch odds history" },
      { status: 500 }
    );
  }
}
