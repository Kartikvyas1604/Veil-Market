import { NextResponse } from "next/server";

function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET() {
  const nonce = generateNonce();

  const response = NextResponse.json({ nonce });

  // Set nonce cookie
  response.cookies.set("siwe-nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  return response;
}
