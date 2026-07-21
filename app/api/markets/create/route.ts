import { NextRequest, NextResponse } from "next/server";

const VALID_CATEGORIES = ["Crypto", "Politics", "Science", "Tech", "Macro", "Sports", "Other"];

function getCommitteeAddresses(): string[] {
  const raw = process.env.COMMITTEE_ADDRESSES ?? "";
  const addresses = raw
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter((a) => /^0x[a-f0-9]{40}$/.test(a));
  if (addresses.length === 0) {
    return ["0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000002"];
  }
  if (addresses.length === 1) {
    return [addresses[0], addresses[0]];
  }
  return addresses;
}

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
      } catch {}
    }

    const finalAddress = sessionAddress || creatorAddress;

    if (!finalAddress) {
      return NextResponse.json({ error: "Unauthorized — connect wallet first", details: "No wallet address found. Please connect your wallet before creating a market." }, { status: 401 });
    }

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required", details: "Please enter a question for your market." }, { status: 400 });
    }
    if (question.length < 10) {
      return NextResponse.json({ error: "Question must be at least 10 characters", details: `Current length: ${question.length} characters.` }, { status: 400 });
    }
    if (question.length > 280) {
      return NextResponse.json({ error: "Question must be 280 characters or less", details: `Current length: ${question.length} characters.` }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
    }

    const resolutionTime = new Date(resolutionDate).getTime();
    if (isNaN(resolutionTime) || resolutionTime <= Date.now()) {
      return NextResponse.json({ error: "Resolution date must be in the future", details: "Please select a date after today." }, { status: 400 });
    }

    // Max 2 years
    const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
    if (resolutionTime > Date.now() + twoYearsMs) {
      return NextResponse.json({ error: "Resolution date cannot be more than 2 years in the future", details: "Markets must resolve within 2 years." }, { status: 400 });
    }

    const minBetNum = parseFloat(minBet) || 0.1;
    const maxBetNum = parseFloat(maxBet) || 1000;
    if (minBetNum <= 0 || maxBetNum <= 0 || minBetNum >= maxBetNum) {
      return NextResponse.json({ error: "Invalid bet range", details: "Min bet must be positive and less than max bet." }, { status: 400 });
    }

    // Build contract calldata for VeilFactory.createMarket()
    // The user's wallet signs and broadcasts this — never the server
    const resolutionTimestampSeconds = Math.floor(resolutionTime / 1000);
    const minBetWei = BigInt(Math.floor(minBetNum * 1e18)).toString();
    const maxBetWei = BigInt(Math.floor(maxBetNum * 1e18)).toString();
    const factoryAddress = process.env.NEXT_PUBLIC_VEIL_FACTORY_ADDRESS;
    const committee = getCommitteeAddresses();

    if (!factoryAddress || !/^0x[a-fA-F0-9]{40}$/.test(factoryAddress)) {
      return NextResponse.json({ error: "Market factory is not configured.", details: "NEXT_PUBLIC_VEIL_FACTORY_ADDRESS is missing or invalid." }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      pendingId: "pending-on-chain",
      market: {
        question: question.trim(),
        category: category,
        resolution_time: new Date(resolutionTime).toISOString(),
      },
      // Calldata params the frontend uses to call createMarket via wagmi/viem
      contractParams: {
        factoryAddress,
        question: question.trim(),
        category,
        resolutionTime: resolutionTimestampSeconds,
        minBet: minBetWei,
        maxBet: maxBetWei,
        committee,
      },
    });
  } catch (error) {
    console.error("POST /api/markets/create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
