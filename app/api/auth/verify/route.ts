import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { createClient } from "@supabase/supabase-js";

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const { address, signature, message } = await request.json();

    if (!address || !signature || !message) {
      return NextResponse.json(
        { error: "Missing required fields: address, signature, message" },
        { status: 400 }
      );
    }

    // Get nonce from cookie
    const nonce = request.cookies.get("siwe-nonce")?.value;
    if (!nonce) {
      return NextResponse.json(
        { error: "No nonce found. Please request a new message." },
        { status: 400 }
      );
    }

    // Parse and verify SIWE message
    const siweMessage = new SiweMessage(message);

    const verification = await siweMessage.verify(
      { signature },
      { suppressExceptions: false }
    );

    if (verification.error) {
      return NextResponse.json(
        { error: `Signature verification failed: ${String(verification.error)}` },
        { status: 401 }
      );
    }

    // Verify nonce
    if (siweMessage.nonce !== nonce) {
      return NextResponse.json(
        { error: "Nonce mismatch" },
        { status: 401 }
      );
    }

    if (siweMessage.domain !== DOMAIN) {
      return NextResponse.json(
        { error: "Signature domain does not match this application" },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create or update user
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", address.toLowerCase())
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await supabase
        .from("users")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);
    } else {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          wallet_address: address.toLowerCase(),
          chain_id: siweMessage.chainId,
        })
        .select("id")
        .single();

      if (createError) {
        return NextResponse.json(
          { error: `Failed to create user: ${createError.message}` },
          { status: 500 }
        );
      }
      userId = newUser.id;
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      userId,
      address: address.toLowerCase(),
    });

    // Set session cookie
    response.cookies.set(
      "veil-session",
      JSON.stringify({
        userId,
        address: address.toLowerCase(),
        chainId: siweMessage.chainId,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      }
    );

    // Clear nonce cookie
    response.cookies.delete("siwe-nonce");

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: `Authentication failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
