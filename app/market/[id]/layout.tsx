import { notFound } from "next/navigation";

export default async function MarketLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const marketId = Number(id);

  if (!Number.isSafeInteger(marketId) || marketId < 0) {
    notFound();
  }

  return children;
}
