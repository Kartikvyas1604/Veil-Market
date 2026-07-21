"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { StampButton } from "@/components/stamp-button";
import { AlertBanner } from "@/components/alert-banner";

import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { decodeEventLog } from "viem";
import { VEIL_FACTORY_ABI } from "@/lib/contracts";

const CATEGORIES = ["Crypto", "Politics", "Science", "Tech", "Macro", "Sports", "Other"];

type Step = "compose" | "review" | "confirming" | "done";

type AppError = {
  title: string;
  message: string;
  details?: string;
  variant: "error" | "warning" | "info";
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "shortMessage" in error && typeof error.shortMessage === "string") {
    return error.shortMessage;
  }
  return fallback;
}

function parseApiError(data: { error?: string; details?: string }, status: number): AppError {
  const msg = data.error || "An unexpected error occurred.";

  if (status === 503) {
    return {
      title: "Service Unavailable",
      message: msg,
      details: "The market creation service is temporarily unavailable. This may be due to misconfigured committee wallets or the service being restarted.",
      variant: "warning",
    };
  }
  if (status === 401) {
    return {
      title: "Authentication Required",
      message: msg,
      details: "Please connect your wallet to create a market.",
      variant: "warning",
    };
  }
  if (status === 400) {
    return {
      title: "Validation Error",
      message: msg,
      details: data.details,
      variant: "error",
    };
  }
  if (status === 500) {
    return {
      title: "Server Error",
      message: msg,
      details: "Something went wrong on our end. Please try again in a moment.",
      variant: "error",
    };
  }
  return {
    title: "Error",
    message: msg,
    details: data.details,
    variant: "error",
  };
}

export default function CreateMarketPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [step, setStep] = useState<Step>("compose");
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("Crypto");
  const [resolutionDate, setResolutionDate] = useState("");
  const [minBet, setMinBet] = useState("0.1");
  const [maxBet, setMaxBet] = useState("1000");
  const [error, setError] = useState<AppError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdMarket, setCreatedMarket] = useState<{ question: string; pendingId: string } | null>(null);
  const [dateBounds] = useState(() => {
    const now = Date.now();
    return {
      min: new Date(now + 86_400_000).toISOString().split("T")[0],
      max: new Date(now + 2 * 365 * 86_400_000).toISOString().split("T")[0],
    };
  });

  const charCount = question.length;
  const charLimit = 280;
  const isQuestionValid = question.trim().length >= 10;
  const isDateProvided = resolutionDate.length > 0;

  function validate(): AppError | null {
    if (!isQuestionValid) return { title: "Invalid Question", message: "Question must be at least 10 characters.", variant: "error" };
    if (charCount > charLimit) return { title: "Question Too Long", message: `Question exceeds ${charLimit} character limit.`, variant: "error" };
    if (!isDateProvided || new Date(resolutionDate).getTime() <= Date.now()) return { title: "Invalid Date", message: "Resolution date must be in the future.", variant: "error" };
    if (parseFloat(minBet) <= 0) return { title: "Invalid Bet Range", message: "Min bet must be greater than 0.", variant: "error" };
    if (parseFloat(maxBet) <= parseFloat(minBet)) return { title: "Invalid Bet Range", message: "Max bet must be greater than min bet.", variant: "error" };
    if (!address) return { title: "Wallet Not Connected", message: "You must connect your wallet first.", variant: "warning" };
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep("review");
  }

  async function handleConfirm() {
    if (!address) {
      setError({ title: "Wallet Not Connected", message: "You must connect your wallet first.", variant: "warning" });
      setStep("compose");
      return;
    }

    setIsSubmitting(true);
    setStep("confirming");

    try {
      const res = await fetch("/api/markets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, category, resolutionDate, minBet, maxBet, creatorAddress: address }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(parseApiError(data, res.status));
        setStep("compose");
        setIsSubmitting(false);
        return;
      }

      // Send the transaction using the calldata from the API
      const txHash = await writeContractAsync({
        abi: VEIL_FACTORY_ABI,
        address: data.contractParams.factoryAddress as `0x${string}`,
        functionName: "createMarket",
        args: [
          data.contractParams.question,
          data.contractParams.category,
          BigInt(data.contractParams.resolutionTime),
          BigInt(data.contractParams.minBet),
          BigInt(data.contractParams.maxBet),
          data.contractParams.committee,
        ],
      });

      console.log("Transaction sent!", txHash);

      // Wait for the transaction to mine
      if (!publicClient) throw new Error("Public client not found");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      let realMarketId = "";
      let realContractAddress = "";

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: VEIL_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "MarketCreated" && decoded.args.marketId !== undefined && decoded.args.marketContract) {
            realMarketId = decoded.args.marketId.toString();
            realContractAddress = decoded.args.marketContract;
            break;
          }
        } catch {
          // ignore logs that don't match our ABI
        }
      }

      if (!realMarketId || !realContractAddress) {
        throw new Error("Could not find MarketCreated event in transaction logs");
      }

      // Sync the real on-chain data to our database
      const syncRes = await fetch("/api/markets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: realMarketId,
          contractAddress: realContractAddress,
          question,
          category,
          resolutionTime: data.contractParams.resolutionTime * 1000,
          minBet,
          maxBet,
        }),
      });

      if (!syncRes.ok) {
        console.error("Failed to sync to DB", await syncRes.text());
        throw new Error("Market deployed but failed to sync to frontend database.");
      }

      setCreatedMarket({ question: data.market.question, pendingId: realMarketId });
      setStep("done");
    } catch (error) {
      console.error(error);
      setError({
        title: "Transaction Failed",
        message: getErrorMessage(error, "Transaction failed or was rejected."),
        details: "Please check your wallet and try again.",
        variant: "error",
      });
      setStep("compose");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      <main id="main-content" className="relative mx-auto max-w-2xl px-4 pt-10 pb-16 md:px-6 md:pt-14">
        {/* Breadcrumb */}
        <div className="mb-8 stagger-enter">
          <Link href="/markets" className="font-mono text-xs text-text-muted transition-colors hover:text-text-secondary">
            ← Markets
          </Link>
        </div>

        {/* Done state */}
        {step === "done" && createdMarket && (
          <div className="text-center py-16 stagger-enter">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-sm border border-border bg-surface-raised">
              <span className="font-mono text-2xl text-text-primary">✓</span>
            </div>
            <h1 className="mb-3 font-serif text-2xl text-text-primary">Market Queued</h1>
            <p className="mb-2 font-mono text-xs text-text-muted max-w-sm mx-auto">
              Your market has been submitted. It will go live once the on-chain transaction is confirmed by the indexer.
            </p>
            <p className="mb-8 font-mono text-[10px] text-text-muted/50 max-w-xs mx-auto truncate">
              {createdMarket.question}
            </p>
            <div className="flex justify-center gap-3">
              <StampButton variant="light" onClick={() => router.push("/markets")}>
                Browse Markets
              </StampButton>
              <button
                onClick={() => {
                  setStep("compose");
                  setQuestion("");
                  setCategory("Crypto");
                  setResolutionDate("");
                  setCreatedMarket(null);
                  setError(null);
                }}
                className="font-mono text-xs text-text-muted underline hover:text-text-secondary transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        )}

        {/* Confirming state */}
        {step === "confirming" && (
          <div className="text-center py-24 stagger-enter">
            <div className="mb-4 font-mono text-4xl text-text-muted animate-pulse">⧗</div>
            <p className="font-serif text-lg text-text-secondary">Submitting market...</p>
            <p className="mt-1 font-mono text-xs text-text-muted">Saving to ledger</p>
          </div>
        )}

        {/* Review step */}
        {step === "review" && (
          <div className="stagger-enter">
            <h1 className="mb-2 font-serif text-3xl text-text-primary">Review Market</h1>
            <p className="mb-8 font-mono text-xs text-text-muted">Confirm details before submission</p>

            <div className="rounded-sm border border-border bg-surface-raised p-6 mb-6 space-y-4">
              {[
                { label: "Question", value: question },
                { label: "Category", value: category },
                { label: "Resolves", value: new Date(resolutionDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                { label: "Min Bet", value: `${minBet} USDC` },
                { label: "Max Bet", value: `${maxBet} USDC` },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-4">
                  <span className="shrink-0 font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase w-20 pt-0.5">{label}</span>
                  <span className="font-serif text-sm text-text-primary">{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-sm border border-border/50 bg-surface/30 p-4 mb-6">
              <p className="font-mono text-[10px] text-text-muted leading-relaxed">
                By creating this market you agree that the question is objectively resolvable, not defamatory, and does not violate applicable laws. Markets with ambiguous outcomes may be voided by the committee.
              </p>
            </div>

            {error && (
              <AlertBanner
                variant={error.variant}
                title={error.title}
                message={error.message}
                details={error.details}
                onDismiss={() => setError(null)}
                className="mb-4"
              />
            )}

            <div className="flex gap-3">
              <StampButton variant="light" className="flex-1" onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </StampButton>
              <button
                onClick={() => setStep("compose")}
                className="px-4 font-mono text-xs text-text-muted border border-border rounded-sm hover:border-border-strong transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Compose step */}
        {(step === "compose") && (
          <div>
            <div className="mb-8 stagger-enter" style={{ animationDelay: "0ms" }}>
              <h1 className="font-serif text-3xl text-text-primary md:text-4xl">Create Market</h1>
              <p className="mt-2 font-mono text-xs text-text-muted">
                Propose a yes/no question on any real-world outcome
              </p>
            </div>

            <div className="space-y-6">
              {/* Question */}
              <div className="stagger-enter" style={{ animationDelay: "60ms" }}>
                <label htmlFor="question" className="mb-2 block font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">
                  Question
                </label>
                <textarea
                  id="question"
                  rows={3}
                  placeholder="Will [event] happen by [date]?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className={cn(
                    "w-full resize-none rounded-sm border bg-surface-elevated px-4 py-3 font-serif text-base text-text-primary placeholder:text-text-muted/40 outline-none transition-colors duration-150",
                    charCount > charLimit ? "border-red-400/60" : "border-border focus:border-text-muted"
                  )}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="font-mono text-[10px] text-text-muted">
                    Must be a clear yes/no question with a definitive resolution criteria
                  </p>
                  <span className={cn("font-mono text-[10px] tabular-nums", charCount > charLimit ? "text-red-400" : "text-text-muted")}>
                    {charCount}/{charLimit}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="stagger-enter" style={{ animationDelay: "100ms" }}>
                <label className="mb-2 block font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500",
                        category === cat
                          ? "border-text-primary bg-text-primary/10 text-text-primary"
                          : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Date */}
              <div className="stagger-enter" style={{ animationDelay: "140ms" }}>
                <label htmlFor="resolution-date" className="mb-2 block font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">
                  Resolution Date
                </label>
                <input
                  id="resolution-date"
                  type="date"
                  min={dateBounds.min}
                  max={dateBounds.max}
                  value={resolutionDate}
                  onChange={(e) => setResolutionDate(e.target.value)}
                  className="rounded-sm border border-border bg-surface-elevated px-4 py-2.5 font-mono text-sm text-text-primary outline-none transition-colors duration-150 focus:border-text-muted w-full md:w-auto"
                />
                <p className="mt-1 font-mono text-[10px] text-text-muted">
                  The date by which this event can be definitively verified
                </p>
              </div>

              {/* Bet Range */}
              <div className="stagger-enter" style={{ animationDelay: "180ms" }}>
                <label className="mb-2 block font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">
                  Bet Range (USDC)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="min-bet" className="mb-1 block font-mono text-[9px] text-text-muted">Min</label>
                    <input
                      id="min-bet"
                      type="number"
                      min="0.01"
                      step="0.1"
                      value={minBet}
                      onChange={(e) => setMinBet(e.target.value)}
                      className="w-full rounded-sm border border-border bg-surface-elevated px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors focus:border-text-muted"
                    />
                  </div>
                  <div>
                    <label htmlFor="max-bet" className="mb-1 block font-mono text-[9px] text-text-muted">Max</label>
                    <input
                      id="max-bet"
                      type="number"
                      min="1"
                      step="1"
                      value={maxBet}
                      onChange={(e) => setMaxBet(e.target.value)}
                      className="w-full rounded-sm border border-border bg-surface-elevated px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors focus:border-text-muted"
                    />
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <AlertBanner
                  variant={error.variant}
                  title={error.title}
                  message={error.message}
                  details={error.details}
                  onDismiss={() => setError(null)}
                />
              )}

              {/* Submit */}
              <div className="stagger-enter pt-2" style={{ animationDelay: "220ms" }}>
                <StampButton
                  variant="light"
                  className="w-full"
                  onClick={handleSubmit}
                >
                  Review Market →
                </StampButton>
                <p className="mt-2 text-center font-mono text-[10px] text-text-muted">
                  All bets on this market will be encrypted with eERC
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
