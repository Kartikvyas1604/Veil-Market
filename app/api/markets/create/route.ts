import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    const body = await request.json();
    const { question, category, resolutionDate, minBet, maxBet, creatorAddress } = body;

    // Verify session or use passed address (since SIWE flow is currently bypassed on frontend)
    const sessionCookie = request.cookies.get("veil-session")?.value;
    let sessionAddress = "";
    if (sessionCookie) {
      try {
        sessionAddress = JSON.parse(sessionCookie).address;
      } catch (e) {}
    }

    const finalAddress = sessionAddress || creatorAddress;

    if (!finalAddress) {
      return NextResponse.json({ error: "Unauthorized — connect wallet first" }, { status: 401 });
    }

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }
    if (question.length < 10) {
      return NextResponse.json({ error: "Question must be at least 10 characters" }, { status: 400 });
    }
    if (question.length > 280) {
      return NextResponse.json({ error: "Question must be 280 characters or less" }, { status: 400 });
    }

    const VALID_CATEGORIES = ["Crypto", "Politics", "Science", "Tech", "Macro", "Sports", "Other"];
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
    }

    const resolutionTime = new Date(resolutionDate).getTime();
    if (isNaN(resolutionTime) || resolutionTime <= Date.now()) {
      return NextResponse.json({ error: "Resolution date must be in the future" }, { status: 400 });
    }

    // Max 2 years
    const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
    if (resolutionTime > Date.now() + twoYearsMs) {
      return NextResponse.json({ error: "Resolution date cannot be more than 2 years in the future" }, { status: 400 });
    }

    const minBetNum = parseFloat(minBet) || 0.1;
    const maxBetNum = parseFloat(maxBet) || 1000;
    if (minBetNum <= 0 || maxBetNum <= 0 || minBetNum >= maxBetNum) {
      return NextResponse.json({ error: "Invalid bet range" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Insert pending market record — gets a real contract_address once on-chain
    const { data: newMarket, error: insertError } = await supabase
      .from("markets")
      .insert({
        // market_id is assigned on-chain; use a temp placeholder
        market_id: -1,
        contract_address: "0xpending",
        question: question.trim(),
        category,
        resolution_time: new Date(resolutionTime).toISOString(),
        min_bet: minBetNum,
        max_bet: maxBetNum,
        status: "pending",
        outcome: "none",
        created_by: finalAddress.toLowerCase(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Market insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save market. Try again." },
        { status: 500 }
      );
    }

    // Build contract calldata for VeilFactory.createMarket()
    // The user's wallet signs and broadcasts this — never the server
    const resolutionTimestampSeconds = Math.floor(resolutionTime / 1000);
    const minBetWei = BigInt(Math.floor(minBetNum * 1e18)).toString();
    const maxBetWei = BigInt(Math.floor(maxBetNum * 1e18)).toString();
    const factoryAddress = process.env.NEXT_PUBLIC_VEIL_FACTORY_ADDRESS;
    const committeeAddress = process.env.COMMITTEE_ADDRESS || finalAddress;

    return NextResponse.json({
      success: true,
      pendingId: newMarket.id,
      market: {
        question: newMarket.question,
        category: newMarket.category,
        resolution_time: newMarket.resolution_time,
      },
      // Calldata params the frontend uses to call createMarket via wagmi/viem
      contractParams: {
        factoryAddress,
        question: question.trim(),
        category,
        resolutionTime: resolutionTimestampSeconds,
        minBet: minBetWei,
        maxBet: maxBetWei,
        committee: [committeeAddress],
      },
    });
  } catch (error) {
    console.error("POST /api/markets/create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
