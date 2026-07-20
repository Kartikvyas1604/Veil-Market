import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { marketId, contractAddress, question, category, resolutionTime, minBet, maxBet, creatorAddress } = body;

    if (!marketId || !contractAddress) {
      return NextResponse.json({ error: "Missing on-chain data" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { data: newMarket, error: insertError } = await supabase
      .from("markets")
      .insert({
        market_id: parseInt(marketId, 10),
        contract_address: contractAddress,
        question: question.trim(),
        category,
        resolution_time: new Date(resolutionTime).toISOString(),
        min_bet: parseFloat(minBet),
        max_bet: parseFloat(maxBet),
        status: "active",
        outcome: "none",
        created_by: creatorAddress.toLowerCase()
      })
      .select()
      .single();

    if (insertError) {
      console.error("Market sync error:", insertError);
      return NextResponse.json({ error: "Failed to sync market to database" }, { status: 500 });
    }

    return NextResponse.json({ success: true, market: newMarket });
  } catch (error) {
    console.error("Sync market error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
