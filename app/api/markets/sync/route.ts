import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { marketId, contractAddress, question, category, resolutionTime, minBet, maxBet } = body;

    if (!Number.isSafeInteger(Number(marketId)) || Number(marketId) < 0 ||
      typeof contractAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress) ||
      typeof question !== "string" || !question.trim() ||
      typeof category !== "string" || !category ||
      !Number.isFinite(Number(resolutionTime)) ||
      !Number.isFinite(Number(minBet)) || !Number.isFinite(Number(maxBet))) {
      return NextResponse.json({ error: "Missing on-chain data" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { data: newMarket, error: insertError } = await supabase
      .from("markets")
      .upsert({
        market_id: parseInt(marketId, 10),
        contract_address: contractAddress.toLowerCase(),
        question: question.trim(),
        category,
        resolution_time: new Date(parseInt(resolutionTime)).toISOString(),
        min_bet: parseFloat(minBet),
        max_bet: parseFloat(maxBet),
        status: "active",
        outcome: "none",
      }, { onConflict: "market_id" })
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
