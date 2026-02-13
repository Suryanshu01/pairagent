import { NextRequest, NextResponse } from "next/server";

/**
 * PairAgent Orchestrator — The EV's AI Brain
 * 
 * Takes device state (battery, location, schedule) and autonomously decides
 * which agents to hire, in what order, passing data between them.
 * 
 * Uses OpenAI for decision-making (or falls back to rule-based logic).
 */

interface DeviceState {
  batteryLevel: number;
  location: { lat: number; lng: number };
  schedule?: string;
  walletBalance: number;
  scenario?: string;
}

interface OrchestratorStep {
  agentId: string;
  agentName: string;
  action: string;
  params: Record<string, any>;
}

interface OrchestratorPlan {
  trigger: string;
  reasoning: string;
  steps: OrchestratorStep[];
  estimatedCost: string;
  estimatedTime: string;
}

// Rule-based orchestrator (works without OpenAI key)
function createPlan(state: DeviceState): OrchestratorPlan {
  const { batteryLevel, scenario } = state;

  if (scenario === "maintenance") {
    return {
      trigger: "Scheduled maintenance window — hiring diagnostic agents",
      reasoning:
        "Vehicle has a scheduled diagnostic check. Need to compare service rates, check weather for outdoor feasibility, find a covered facility, and book a slot.",
      steps: [
        {
          agentId: "pricing-agent",
          agentName: "ChargePricer",
          action: "Comparing diagnostic service rates across agent marketplace",
          params: { type: "diagnostic", radius: 5 },
        },
        {
          agentId: "weather-agent",
          agentName: "AtmoSense",
          action: "Checking conditions for outdoor diagnostic feasibility",
          params: { lat: state.location.lat, lng: state.location.lng },
        },
        {
          agentId: "routing-agent",
          agentName: "PathFinder",
          action: "Finding nearest covered service point with available agents",
          params: { destination: "nearest_diagnostic", batteryLevel },
        },
        {
          agentId: "slot-agent",
          agentName: "SlotNegotiator",
          action: "Reserving diagnostic bay + hiring BatteryDoc agent",
          params: { type: "diagnostic", duration: 30 },
        },
      ],
      estimatedCost: "$0.011",
      estimatedTime: "~12 seconds",
    };
  }

  if (scenario === "fleet") {
    return {
      trigger: "Fleet optimization signal — reducing idle cost via repositioning",
      reasoning:
        "Fleet AI detected a high-demand zone forming. Evaluating whether repositioning cost justifies the expected revenue gain.",
      steps: [
        {
          agentId: "routing-agent",
          agentName: "PathFinder",
          action: "Analyzing fleet positioning for demand prediction",
          params: { mode: "fleet_optimization", batteryLevel },
        },
        {
          agentId: "pricing-agent",
          agentName: "ChargePricer",
          action: "Evaluating repositioning cost vs. expected revenue",
          params: { type: "cost_benefit", radius: 10 },
        },
        {
          agentId: "weather-agent",
          agentName: "AtmoSense",
          action: "Verifying route conditions for repositioning window",
          params: { lat: state.location.lat, lng: state.location.lng },
        },
        {
          agentId: "slot-agent",
          agentName: "SlotNegotiator",
          action: "Pre-booking priority pickup zone via municipal agent",
          params: { type: "zone_reservation", duration: 45 },
        },
      ],
      estimatedCost: "$0.011",
      estimatedTime: "~12 seconds",
    };
  }

  // Default: low battery charging sequence
  return {
    trigger: `Battery at ${batteryLevel}% — initiating autonomous charge sequence`,
    reasoning:
      "Battery below safe threshold. Need to check weather impact on efficiency, find cheapest charging station, compute energy-optimal route, and reserve a slot.",
    steps: [
      {
        agentId: "weather-agent",
        agentName: "AtmoSense",
        action: "Querying hyperlocal weather for route efficiency impact",
        params: { lat: state.location.lat, lng: state.location.lng },
      },
      {
        agentId: "pricing-agent",
        agentName: "ChargePricer",
        action: "Scanning 12 stations within 8km radius via x402 pay-per-query",
        params: { radius: 8, batteryLevel },
      },
      {
        agentId: "routing-agent",
        agentName: "PathFinder",
        action: "Computing energy-optimal route to best station",
        params: { destination: "gc7", batteryLevel },
      },
      {
        agentId: "slot-agent",
        agentName: "SlotNegotiator",
        action: "Negotiating charging slot with station agent via A2A",
        params: { stationId: "gc7", duration: 45 },
      },
    ],
    estimatedCost: "$0.011",
    estimatedTime: "~12 seconds",
  };
}

// Optional: LLM-powered orchestrator for smarter decisions
async function createPlanWithLLM(state: DeviceState): Promise<OrchestratorPlan | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are the AI brain of an autonomous EV (PairAgent). You decide which AI agents to hire and in what order.

Available agents:
- weather-agent (AtmoSense): Weather data, $0.001/call
- pricing-agent (ChargePricer): Charging station prices, $0.002/call  
- routing-agent (PathFinder): Route optimization, $0.005/call
- slot-agent (SlotNegotiator): Booking/negotiation via A2A, $0.003/call

Respond with JSON: { "trigger": "string", "reasoning": "string", "steps": [{"agentId": "string", "agentName": "string", "action": "string describing what the agent will do", "params": {}}], "estimatedCost": "string", "estimatedTime": "string" }`,
        },
        {
          role: "user",
          content: `Device state: Battery ${state.batteryLevel}%, location (${state.location.lat}, ${state.location.lng}), wallet ${state.walletBalance} USDC. ${state.scenario ? `Scenario: ${state.scenario}` : "Decide the best action."}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as OrchestratorPlan;
    }
  } catch (error) {
    console.error("[Orchestrator] LLM planning failed:", error);
  }

  return null;
}

export async function POST(req: NextRequest) {
  const state: DeviceState = await req.json();

  // Try LLM-powered planning first, fall back to rule-based
  let plan = await createPlanWithLLM(state);
  if (!plan) {
    plan = createPlan(state);
  }

  return NextResponse.json({
    orchestrator: "PairAgent EV Brain",
    deviceId: process.env.NEXT_PUBLIC_PAIRPOINT_DEVICE_ID || "PP-EV-X402-DEMO",
    plan,
    metadata: {
      planningMethod: plan ? "llm" : "rule-based",
      erc8004AgentId: process.env.NEXT_PUBLIC_ERC8004_AGENT_ID || "8004",
      encryption: "SKALE BITE",
    },
  });
}
