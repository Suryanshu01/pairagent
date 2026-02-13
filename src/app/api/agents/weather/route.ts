import { NextRequest, NextResponse } from "next/server";

/**
 * AtmoSense Agent — x402 Gated
 * Hyperlocal weather affecting battery & route efficiency.
 * $0.001 USDC per call via x402.
 */

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { lat = 37.785, lng = -122.409 } = body;

  await new Promise((r) => setTimeout(r, 100 + Math.random() * 100));

  return NextResponse.json({
    agent: "AtmoSense",
    agentId: "weather-agent",
    _price: "0.001",
    timestamp: new Date().toISOString(),
    location: { lat, lng, zone: "SF-Downtown-7" },
    current: {
      temperature: { value: 72, unit: "°F", feels_like: 70 },
      humidity: 45,
      wind: { speed: 5, direction: "NE", unit: "mph" },
      precipitation: { probability: 0, type: "none" },
      visibility: "10+ miles",
      uvIndex: 4,
      airQuality: { index: 42, label: "Good" },
    },
    batteryImpact: {
      temperatureEffect: "+4% efficiency (optimal 65-75°F range)",
      windEffect: "-0.3% (mild headwind on NE routes)",
      netImpact: "+3.7% efficiency gain",
      recommendation: "Optimal driving conditions. No weather-related concerns.",
    },
    forecast: {
      next1hr: "Clear, 71°F",
      next3hr: "Clear, 68°F, wind increasing to 8mph",
      next6hr: "Partly cloudy, 64°F",
      precipitation6hr: "0%",
    },
    recommendation: "Clear skies. +4% battery efficiency from optimal temperature. No weather-related delays expected for the next 3 hours.",
    metadata: {
      protocol: "x402",
      network: "Base Sepolia",
      dataSource: "PairAgent Weather Intelligence Grid",
      resolution: "500m hyperlocal",
    },
  });
}
