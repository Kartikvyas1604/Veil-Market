import { NextRequest, NextResponse } from "next/server";
import { getMarket, getMarketActivity } from "@/lib/actions/markets";

/**
 * GET /api/markets/[id]
 *
 * Returns a single market with latest odds and recent activity.
 * Used by the market detail page for initial server-rendered data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const marketId = Number(id);

  if (!Number.isSafeInteger(marketId) || marketId < 0) {
    return NextResponse.json({ error: "Invalid market ID" }, { status: 400 });
  }

  try {
    const [market, activity] = await Promise.all([
      getMarket(marketId),
      getMarketActivity(marketId, 20),
    ]);

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    return NextResponse.json(
      { market, activity },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error(`GET /api/markets/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch market" },
      { status: 500 }
    );
  }
}
