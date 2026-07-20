import { NextResponse } from "next/server";
import { getMarkets, getMarketsByStatus, getMarketsByCategory, searchMarkets } from "@/lib/actions/markets";

/**
 * GET /api/markets
 *
 * Returns all markets with latest odds.
 * Query params:
 *   ?status=active|resolved|disputed
 *   ?category=Crypto|Politics|Science|Tech|Macro
 *   ?search=query string
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as "active" | "resolved" | "disputed" | null;
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    let markets;

    if (search) {
      markets = await searchMarkets(search);
    } else if (status) {
      markets = await getMarketsByStatus(status);
    } else if (category) {
      markets = await getMarketsByCategory(category);
    } else {
      markets = await getMarkets();
    }

    return NextResponse.json(
      { markets, count: markets.length },
      {
        headers: {
          // Cache for 10 seconds — Supabase Realtime handles live updates
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/markets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
