import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PairAgent — Autonomous IoT Commerce Engine",
  description:
    "IoT devices that autonomously discover, hire, and pay AI agents via x402 micropayments. Built with Pairpoint, SKALE, Google A2A, and ERC-8004.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
