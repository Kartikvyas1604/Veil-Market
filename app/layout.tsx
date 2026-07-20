import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Fraunces } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ParticleFieldWrapper } from "@/components/particle-field-wrapper";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VEIL — Confidential Prediction Markets",
  description:
    "Encrypted positions on real-world outcomes. Nobody sees your bet until settlement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${jetbrainsMono.variable} ${fraunces.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-sm focus:bg-veil-900 focus:px-4 focus:py-2 focus:text-sm focus:text-text-primary focus:outline-2 focus:outline-veil-500"
        >
          Skip to content
        </a>
        <SmoothScroll>
          <ParticleFieldWrapper />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
