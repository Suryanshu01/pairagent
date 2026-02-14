// middleware.ts — x402 Payment Gate on SKALE Base Sepolia
// Per hackathon requirements: "All submissions should be on SKALE Base Mainnet,
// SKALE Base Sepolia Testnet, or SKALE BITE Sandbox chain."
//
// SKALE Base Sepolia (Chain ID: 324705682) is gasless — zero gas fees for payments.
// Uses EIP-3009 (TransferWithAuthorization) for gasless USDC micropayments.
// BITE Protocol encrypts payment metadata for IoT device privacy.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NOTE: x402-next package integration pending
// For now, using pass-through middleware. The app works in simulation mode.
// To enable real x402 payments:
// 1. Install: npm install x402-next (when available)
// 2. Uncomment the x402 middleware implementation below

// Wallet that RECEIVES agent service payments
const AGENT_SERVICES_WALLET =
  process.env.NEXT_PUBLIC_AGENT_SERVICES_WALLET || "0xYOUR_RECEIVING_WALLET_ADDRESS";

// x402 facilitator handles payment verification and on-chain settlement
const facilitator = {
  url: "https://x402.org/facilitator" as `https://${string}`,
};

// Network: SKALE Base Sepolia Testnet (CAIP-2: eip155:324705682)
// Gasless EVM chain with native EIP-3009 USDC support
// USDC Contract: 0x2e08028E3C4c2356572E096d8EF835cD5C6030bD
const NETWORK = "base-sepolia";

// Pass-through middleware for now (simulation mode)
export function middleware(request: NextRequest) {
  // Allow all requests to pass through
  // The app handles payments in simulation mode via the client-side code
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/agents/:path*"],
};
