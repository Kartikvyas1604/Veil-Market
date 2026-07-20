"use server";

import { cookies } from "next/headers";
import { SiweMessage } from "siwe";
import { supabase } from "@/lib/supabase";

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "localhost:3000";
const STATEMENT = "Sign in to VEIL — Confidential Prediction Markets";

/**
 * Create a SIWE message for the user to sign
 */
export async function createSiweMessage(address: string, chainId: number) {
  const nonce = generateNonce();

  const message = new SiweMessage({
    domain: DOMAIN,
    address,
    statement: STATEMENT,
    uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`,
    version: "1",
    chainId,
    nonce,
  });

  // Store nonce in cookie for verification
  const cookieStore = await cookies();
  cookieStore.set("siwe-nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });

  return message.prepareMessage();
}

/**
 * Verify a SIWE signature and create a Supabase session
 */
export async function verifySiweMessage(
  address: string,
  signature: string,
  message: string
) {
  try {
    const cookieStore = await cookies();
    const nonce = cookieStore.get("siwe-nonce")?.value;

    if (!nonce) {
      return { error: "No nonce found. Please request a new message." };
    }

    const siweMessage = new SiweMessage(message);

    // Verify the message
    const { error: verifyError } =
      await siweMessage.verify({ signature }, { suppressExceptions: false });

    if (verifyError) {
      return { error: `Signature verification failed: ${String(verifyError)}` };
    }

    // Verify nonce matches
    if (siweMessage.nonce !== nonce) {
      return { error: "Nonce mismatch. Please try again." };
    }

    // Verify domain
    if (siweMessage.domain !== DOMAIN) {
      return { error: "Domain mismatch." };
    }

    // Create or update user in Supabase
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", address.toLowerCase())
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update last_seen_at
      await supabase
        .from("users")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          wallet_address: address.toLowerCase(),
          chain_id: siweMessage.chainId,
        })
        .select("id")
        .single();

      if (createError) {
        return { error: `Failed to create user: ${createError.message}` };
      }
      userId = newUser.id;
    }

    // Clear nonce cookie
    cookieStore.delete("siwe-nonce");

    // Set session cookie
    cookieStore.set(
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
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      }
    );

    return {
      success: true,
      userId,
      address: address.toLowerCase(),
    };
  } catch (error) {
    return { error: `Authentication failed: ${String(error)}` };
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("veil-session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie);
  } catch {
    return null;
  }
}

/**
 * Sign out
 */
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("veil-session");
  return { success: true };
}

function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
