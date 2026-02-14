export interface AgentConfig {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  pricePerCall: string; // in USDC, e.g. "0.002"
  endpoint: string;
  latency: string;
  reputation: number;
  color: string;
  capabilities: string[];
}

export const AGENT_REGISTRY: AgentConfig[] = [
  {
    id: "pricing-agent",
    name: "ChargePricer",
    type: "Pricing Oracle",
    icon: "⚡",
    description: "Real-time EV charging station price comparison across 12+ networks",
    pricePerCall: "0.002",
    endpoint: "/api/agents/pricing",
    latency: "~200ms",
    reputation: 4.9,
    color: "#00ff9d",
    capabilities: ["price_comparison", "rate_forecast", "surge_detection"],
  },
  {
    id: "routing-agent",
    name: "PathFinder",
    type: "Route Optimizer",
    icon: "🗺️",
    description: "AI-optimized routing with energy consumption modeling",
    pricePerCall: "0.005",
    endpoint: "/api/agents/routing",
    latency: "~400ms",
    reputation: 4.7,
    color: "#00b4ff",
    capabilities: ["route_optimization", "energy_modeling", "traffic_avoidance"],
  },
  {
    id: "weather-agent",
    name: "AtmoSense",
    type: "Weather Intelligence",
    icon: "🌦️",
    description: "Hyperlocal weather data affecting battery efficiency & route planning",
    pricePerCall: "0.001",
    endpoint: "/api/agents/weather",
    latency: "~150ms",
    reputation: 4.8,
    color: "#ff6b00",
    capabilities: ["weather_forecast", "efficiency_impact", "road_conditions"],
  },
  {
    id: "slot-agent",
    name: "SlotNegotiator",
    type: "Booking Agent",
    icon: "📅",
    description: "Autonomous charging slot negotiation & reservation via A2A",
    pricePerCall: "0.003",
    endpoint: "/api/agents/slot",
    latency: "~350ms",
    reputation: 4.6,
    color: "#c084fc",
    capabilities: ["slot_booking", "price_negotiation", "cancellation"],
  },
];

export const DEVICE_CONFIG = {
  type: "EV",
  model: "PairAgent EV-X402",
  pairpointId: process.env.NEXT_PUBLIC_PAIRPOINT_DEVICE_ID || "PP-EV-X402-DEMO",
  erc8004Id: process.env.NEXT_PUBLIC_ERC8004_AGENT_ID || "8004",
  network: "SKALE Base Sepolia",
  chainId: 324705682,
  encryption: "BITE Protocol",
};

// SKALE Base Sepolia Chain Details (for reference)
// Chain ID: 324705682
// RPC: https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha
// USDC: 0x2e08028E3C4c2356572E096d8EF835cD5C6030bD
// Gas: FREE (sFUEL auto-distributed)
// BITE: Threshold encryption for payment privacy
