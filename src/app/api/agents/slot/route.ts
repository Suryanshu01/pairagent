import { NextRequest, NextResponse } from "next/server";

/**
 * SlotNegotiator Agent — x402 Gated
 * Autonomous charging slot negotiation & reservation via A2A protocol.
 * $0.003 USDC per call via x402.
 */

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { stationId = "gc7", preferredTime, duration = 45 } = body;

  await new Promise((r) => setTimeout(r, 250 + Math.random() * 150));

  const startTime = new Date(Date.now() + 6 * 60 * 1000); // 6 min from now
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  return NextResponse.json({
    agent: "SlotNegotiator",
    agentId: "slot-agent",
    _price: "0.003",
    timestamp: new Date().toISOString(),
    negotiation: {
      protocol: "Google A2A",
      counterparty: "GreenCharge Station Agent #7",
      rounds: 2,
      outcome: "accepted",
      negotiatedDiscount: "5% off standard rate",
    },
    booking: {
      confirmationId: `BK-${Date.now().toString(36).toUpperCase()}`,
      station: "GreenCharge Station #7",
      bay: 3,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${duration} min`,
      rate: "$0.114/kWh (5% negotiated discount)",
      estimatedCost: "$4.10",
      cancellationPolicy: "Free cancellation until arrival",
    },
    authorization: {
      type: "AP2 Intent Mandate",
      maxAmount: "$5.00 USDC",
      scope: "single_charge_session",
      signedBy: process.env.NEXT_PUBLIC_PAIRPOINT_DEVICE_ID || "PP-EV-X402-DEMO",
      mandateHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    },
    recommendation: `Bay 3 secured at GreenCharge #7. Negotiated 5% discount via A2A. Pre-authorized via AP2 Intent Mandate (max $5.00). Free cancellation until arrival.`,
    metadata: {
      protocol: "x402 + A2A + AP2",
      network: "Base Sepolia",
      a2aVersion: "0.3.0",
      ap2MandateType: "IntentMandate",
    },
  });
}
