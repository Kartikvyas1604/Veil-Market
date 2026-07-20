import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("veil-session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const session = JSON.parse(sessionCookie);
    return NextResponse.json({
      authenticated: true,
      userId: session.userId,
      address: session.address,
      chainId: session.chainId,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
