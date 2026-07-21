/**
 * Centralized error message translator for Veil Market.
 *
 * Converts raw technical errors (viem contract errors, MetaMask rejections,
 * network failures, API validation errors) into user-friendly messages
 * with contextual icons, titles, and actionable recovery hints.
 */

export interface FriendlyError {
  /** Short headline shown in the toast/banner */
  title: string;
  /** A human-readable explanation, free of jargon */
  message: string;
  /** Monospace icon string for the UI badge */
  icon: string;
  /** Severity affects styling — "warning" is amber, "error" is red, "info" is neutral */
  severity: "error" | "warning" | "info";
  /** Optional hint telling the user what to do next */
  hint?: string;
  /** Whether this error is auto-dismissable after a few seconds */
  autoDismiss?: boolean;
}

/* ── Pattern matchers (order matters — first match wins) ── */

const ERROR_PATTERNS: {
  test: (raw: string) => boolean;
  result: Omit<FriendlyError, "autoDismiss">;
}[] = [
  // ── Wallet / Signing ──
  {
    test: (r) => /user (rejected|denied|cancelled)/i.test(r) || /user rejected/i.test(r),
    result: {
      title: "Transaction Cancelled",
      message: "You declined the transaction in your wallet. No funds were moved.",
      icon: "✕",
      severity: "warning",
      hint: "Click the button again when you're ready to confirm.",
    },
  },
  {
    test: (r) => /connect.*wallet/i.test(r) || /unauthorized/i.test(r),
    result: {
      title: "Wallet Not Connected",
      message: "You need to connect your wallet before performing this action.",
      icon: "⛓",
      severity: "info",
      hint: "Use the Connect Wallet button in the top navigation.",
    },
  },
  {
    test: (r) => /insufficient funds/i.test(r) || /exceeds balance/i.test(r),
    result: {
      title: "Insufficient Balance",
      message: "Your wallet doesn't have enough funds to complete this transaction.",
      icon: "$",
      severity: "error",
      hint: "Top up your wallet with USDC on Avalanche Fuji to continue.",
    },
  },

  // ── Network / RPC ──
  {
    test: (r) => /network/i.test(r) && /changed/i.test(r),
    result: {
      title: "Wrong Network",
      message: "Please switch to the Avalanche Fuji testnet in your wallet.",
      icon: "⚡",
      severity: "warning",
      hint: "Open MetaMask and switch to Avalanche Fuji C-Chain.",
    },
  },
  {
    test: (r) => /timeout|timed? ?out|ETIMEDOUT/i.test(r),
    result: {
      title: "Network Timeout",
      message: "The blockchain node didn't respond in time. This is usually temporary.",
      icon: "⧗",
      severity: "warning",
      hint: "Wait a moment and try again.",
    },
  },
  {
    test: (r) => /could not detect network|failed to fetch|ERR_NETWORK/i.test(r),
    result: {
      title: "Connection Lost",
      message: "Unable to reach the blockchain network. Check your internet connection.",
      icon: "⊘",
      severity: "error",
      hint: "Make sure you're online, then refresh the page.",
    },
  },

  // ── Contract / On-chain ──
  {
    test: (r) => /execution reverted/i.test(r),
    result: {
      title: "Transaction Failed",
      message: "The smart contract rejected this transaction. The market rules may prevent this action.",
      icon: "⚠",
      severity: "error",
      hint: "Double-check the bet amount is within the allowed range.",
    },
  },
  {
    test: (r) => /MarketCreated.*event/i.test(r) || /could not find.*event/i.test(r),
    result: {
      title: "Sync Issue",
      message: "Your market was deployed, but we couldn't read the confirmation event from the chain.",
      icon: "↻",
      severity: "warning",
      hint: "Your market should appear shortly on the Markets page. If not, contact support.",
    },
  },
  {
    test: (r) => /failed to sync/i.test(r),
    result: {
      title: "Database Sync Failed",
      message: "Your market is live on-chain but hasn't appeared in the app yet.",
      icon: "↻",
      severity: "warning",
      hint: "Refresh the Markets page in a minute — it should show up automatically.",
    },
  },

  // ── API / Server ──
  {
    test: (r) => /committee/i.test(r),
    result: {
      title: "Platform Not Ready",
      message: "The market resolution committee hasn't been fully configured yet. Market creation is temporarily disabled.",
      icon: "⏸",
      severity: "info",
      hint: "This is a platform-level setting. Please check back later.",
    },
  },
  {
    test: (r) => /factory.*not configured/i.test(r),
    result: {
      title: "Contract Not Deployed",
      message: "The market factory smart contract hasn't been configured. Market creation is temporarily unavailable.",
      icon: "⏸",
      severity: "info",
      hint: "The platform administrators need to deploy the factory contract.",
    },
  },
  {
    test: (r) => /internal server error/i.test(r),
    result: {
      title: "Server Error",
      message: "Something went wrong on our end. Your funds are safe — nothing was sent on-chain.",
      icon: "⚠",
      severity: "error",
      hint: "Try again in a few moments. If this persists, please report it.",
    },
  },

  // ── Validation ──
  {
    test: (r) => /question.*at least/i.test(r),
    result: {
      title: "Question Too Short",
      message: "Your market question needs to be at least 10 characters long.",
      icon: "✎",
      severity: "warning",
    },
  },
  {
    test: (r) => /question.*280/i.test(r) || /exceeds.*character/i.test(r),
    result: {
      title: "Question Too Long",
      message: "Keep your market question under 280 characters for readability.",
      icon: "✎",
      severity: "warning",
    },
  },
  {
    test: (r) => /resolution date.*future/i.test(r),
    result: {
      title: "Invalid Date",
      message: "The resolution date must be in the future.",
      icon: "📅",
      severity: "warning",
    },
  },
  {
    test: (r) => /resolution date.*2 years/i.test(r),
    result: {
      title: "Date Too Far",
      message: "The resolution date can't be more than 2 years from today.",
      icon: "📅",
      severity: "warning",
    },
  },
  {
    test: (r) => /invalid bet range/i.test(r) || /min bet|max bet/i.test(r),
    result: {
      title: "Invalid Bet Range",
      message: "Make sure the minimum bet is greater than 0, and the maximum is greater than the minimum.",
      icon: "$",
      severity: "warning",
    },
  },
  {
    test: (r) => /invalid category/i.test(r),
    result: {
      title: "Invalid Category",
      message: "Please select a valid market category.",
      icon: "☰",
      severity: "warning",
    },
  },
  {
    test: (r) => /invalid bet amount/i.test(r) || /bet amount must be greater than zero/i.test(r),
    result: {
      title: "Invalid Amount",
      message: "Enter a valid bet amount greater than zero.",
      icon: "$",
      severity: "warning",
    },
  },
  {
    test: (r) => /public client not found/i.test(r),
    result: {
      title: "Wallet Initializing",
      message: "Your wallet connection is still being set up.",
      icon: "⧗",
      severity: "info",
      hint: "Wait a moment and try again.",
    },
  },
];

/**
 * Translate a raw error (string, Error, or viem contract error object)
 * into a user-friendly FriendlyError.
 */
export function translateError(raw: unknown): FriendlyError {
  let rawStr = "";

  if (typeof raw === "string") {
    rawStr = raw;
  } else if (raw instanceof Error) {
    rawStr = raw.message;
  } else if (typeof raw === "object" && raw !== null) {
    // viem contract errors have a shortMessage
    if ("shortMessage" in raw && typeof (raw as Record<string, unknown>).shortMessage === "string") {
      rawStr = (raw as Record<string, unknown>).shortMessage as string;
    } else if ("message" in raw && typeof (raw as Record<string, unknown>).message === "string") {
      rawStr = (raw as Record<string, unknown>).message as string;
    }
  }

  if (!rawStr) {
    rawStr = String(raw);
  }

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(rawStr)) {
      return {
        ...pattern.result,
        autoDismiss: pattern.result.severity === "warning",
      };
    }
  }

  // Fallback — generic but still friendly
  return {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Your funds remain safe on-chain.",
    icon: "⚠",
    severity: "error",
    hint: "Try again or refresh the page.",
    autoDismiss: false,
  };
}
