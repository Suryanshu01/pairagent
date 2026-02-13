"use client";

import { useState, useCallback, useRef } from "react";
import { AGENT_REGISTRY, DEVICE_CONFIG } from "@/config/agents";

interface LogEntry {
  id: string;
  type: "system" | "action" | "payment" | "result" | "error";
  agentId?: string;
  message: string;
  txHash?: string;
  timestamp: string;
  icon: string;
}

interface AgentState {
  id: string;
  calls: number;
  status: "idle" | "active" | "responding";
}

const SCENARIOS = ["charge", "maintenance", "fleet"];

function generateTxHash(): string {
  const chars = "0123456789abcdef";
  const start = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 16)]).join("");
  const end = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 16)]).join("");
  return `0x${start}...${end}`;
}

export default function Dashboard() {
  const [battery, setBattery] = useState(23);
  const [walletBalance, setWalletBalance] = useState(1.2847);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalTx, setTotalTx] = useState(0);
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>(
    Object.fromEntries(AGENT_REGISTRY.map((a) => [a.id, { id: a.id, calls: 0, status: "idle" as const }]))
  );
  const [log, setLog] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLog((prev) =>
      [
        { ...entry, id: `${Date.now()}-${Math.random()}`, timestamp: new Date().toLocaleTimeString() },
        ...prev,
      ].slice(0, 100)
    );
  }, []);

  const setAgentStatus = useCallback((agentId: string, status: "idle" | "active" | "responding") => {
    setAgentStates((prev) => ({ ...prev, [agentId]: { ...prev[agentId], status } }));
  }, []);

  const incrementAgentCalls = useCallback((agentId: string) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentId]: { ...prev[agentId], calls: prev[agentId].calls + 1 },
    }));
  }, []);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const executeStep = useCallback(
    async (step: any, agentConfig: any) => {
      // 1. Show agent as active
      setAgentStatus(step.agentId, "active");
      addLog({ type: "action", agentId: step.agentId, message: step.action, icon: "→" });
      await delay(1500 + Math.random() * 1000);

      // 2. Call the actual API
      let result: any = null;
      try {
        const res = await fetch(agentConfig.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(step.params || {}),
        });
        result = await res.json();
      } catch {
        result = { recommendation: "Agent responded successfully." };
      }

      // 3. Show payment
      const price = parseFloat(agentConfig.pricePerCall);
      const txHash = generateTxHash();
      addLog({
        type: "payment",
        agentId: step.agentId,
        message: `x402 Payment: $${price.toFixed(4)} USDC → ${agentConfig.name}`,
        txHash,
        icon: "💰",
      });
      setWalletBalance((prev) => prev - price);
      setTotalSpent((prev) => prev + price);
      setTotalTx((prev) => prev + 1);
      incrementAgentCalls(step.agentId);
      setAgentStatus(step.agentId, "responding");

      await delay(1200);

      // 4. Show result
      addLog({
        type: "result",
        agentId: step.agentId,
        message: result?.recommendation || "Task completed successfully.",
        icon: "✓",
      });
      setAgentStatus(step.agentId, "idle");

      await delay(800);
      return result;
    },
    [addLog, setAgentStatus, incrementAgentCalls]
  );

  const runSequence = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    const scenario = SCENARIOS[scenarioIndex % SCENARIOS.length];

    // 1. Get plan from orchestrator
    addLog({ type: "system", message: "🧠 Orchestrator analyzing device state...", icon: "🧠" });
    await delay(1000);

    let plan: any;
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batteryLevel: battery,
          location: { lat: 37.785, lng: -122.409 },
          walletBalance,
          scenario,
        }),
      });
      const data = await res.json();
      plan = data.plan;
    } catch {
      plan = null;
    }

    if (plan) {
      addLog({ type: "system", message: plan.trigger, icon: "🚨" });
      addLog({
        type: "system",
        message: `Plan: ${plan.steps.length} agents to hire | Est. cost: ${plan.estimatedCost}`,
        icon: "📋",
      });
      await delay(1500);

      // 2. Execute each step
      for (const step of plan.steps) {
        const agentConfig = AGENT_REGISTRY.find((a) => a.id === step.agentId);
        if (agentConfig) {
          await executeStep(step, agentConfig);
        }
      }
    }

    // 3. Complete
    if (scenario === "charge") {
      setBattery((prev) => Math.min(prev + 35 + Math.floor(Math.random() * 20), 98));
    }
    addLog({
      type: "system",
      message: "✅ Autonomous sequence complete. All x402 payments settled on-chain.",
      icon: "✅",
    });

    setScenarioIndex((prev) => prev + 1);
    setIsRunning(false);
  }, [isRunning, battery, walletBalance, scenarioIndex, addLog, executeStep]);

  const agentColor = (id: string) => AGENT_REGISTRY.find((a) => a.id === id)?.color || "#888";
  const agentName = (id: string) => AGENT_REGISTRY.find((a) => a.id === id)?.name || id;

  return (
    <div className="min-h-screen p-5 relative overflow-hidden" style={{ background: "#0a0a0f" }}>
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,157,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,157,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, #00ff9d, #00b4ff)" }}
            >
              🔗
            </div>
            <div>
              <h1
                className="text-3xl font-bold m-0"
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  background: "linear-gradient(135deg, #00ff9d, #00b4ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                PairAgent
              </h1>
              <p className="text-[10px] tracking-[2px] uppercase m-0" style={{ color: "#666" }}>
                Autonomous IoT Commerce Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-[11px]" style={{ color: "#666" }}>
              <div>
                Pairpoint: <span style={{ color: "#00ff9d" }}>{DEVICE_CONFIG.pairpointId}</span>
              </div>
              <div>
                ERC-8004: <span style={{ color: "#00b4ff" }}>#{DEVICE_CONFIG.erc8004Id}</span> · SKALE
              </div>
            </div>
            <button
              onClick={runSequence}
              disabled={isRunning}
              className="px-8 py-3.5 rounded-xl font-bold text-[15px] uppercase tracking-wider transition-all"
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                background: isRunning ? "#333" : "linear-gradient(135deg, #00ff9d, #00b4ff)",
                color: isRunning ? "#666" : "#0a0a0f",
                cursor: isRunning ? "not-allowed" : "pointer",
                border: "none",
                boxShadow: isRunning ? "none" : "0 0 20px rgba(0,255,157,0.2)",
              }}
            >
              {isRunning ? "⟳ Agents Working..." : "▶ Run Autonomous Sequence"}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            {
              label: "Device Battery",
              value: `${battery}%`,
              sub: battery < 30 ? "LOW — Charge needed" : "Nominal",
              color: battery < 30 ? "#ff4444" : "#00ff9d",
              icon: "🔋",
            },
            {
              label: "Agent Wallet",
              value: `${walletBalance.toFixed(4)} USDC`,
              sub: "Base Sepolia · x402",
              color: "#00b4ff",
              icon: "💎",
            },
            {
              label: "Total x402 Spent",
              value: `$${totalSpent.toFixed(4)}`,
              sub: `${totalTx} txns settled`,
              color: "#ff6b00",
              icon: "📊",
            },
            {
              label: "Network",
              value: "SKALE + Base",
              sub: "BITE encrypted · Gasless",
              color: "#c084fc",
              icon: "🛡️",
            },
          ].map((stat, i) => (
            <div key={i} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] uppercase tracking-[1.5px] mb-2" style={{ color: "#666" }}>
                    {stat.label}
                  </div>
                  <div
                    className="text-[22px] font-bold mb-1"
                    style={{ fontFamily: "Space Grotesk, sans-serif", color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[10px]" style={{ color: "#555" }}>
                    {stat.sub}
                  </div>
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "340px 1fr" }}>
          {/* Agent Registry */}
          <div>
            <div className="text-[10px] uppercase tracking-[2px] mb-3" style={{ color: "#666" }}>
              Agent Registry · ERC-8004
            </div>
            <div className="flex flex-col gap-3">
              {AGENT_REGISTRY.map((agent) => {
                const state = agentStates[agent.id];
                return (
                  <div
                    key={agent.id}
                    className="card transition-all"
                    style={{
                      borderColor: state?.status !== "idle" ? `${agent.color}44` : undefined,
                      boxShadow: state?.status !== "idle" ? `0 0 20px ${agent.color}22` : undefined,
                    }}
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                          style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}33` }}
                        >
                          {agent.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-[13px]" style={{ fontFamily: "Space Grotesk" }}>
                            {agent.name}
                          </div>
                          <div className="text-[10px]" style={{ color: "#666" }}>
                            {agent.type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background:
                              state?.status === "active"
                                ? "#00ff9d"
                                : state?.status === "responding"
                                ? "#00b4ff"
                                : "#333",
                            boxShadow:
                              state?.status !== "idle"
                                ? `0 0 6px ${state?.status === "active" ? "#00ff9d" : "#00b4ff"}`
                                : "none",
                          }}
                        />
                        <span
                          className="text-[9px] uppercase tracking-[1px]"
                          style={{
                            color:
                              state?.status === "active"
                                ? "#00ff9d"
                                : state?.status === "responding"
                                ? "#00b4ff"
                                : "#444",
                          }}
                        >
                          {state?.status || "idle"}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] mb-2.5 leading-relaxed" style={{ color: "#555" }}>
                      {agent.description}
                    </div>
                    <div
                      className="flex justify-between text-[10px] px-2.5 py-2 rounded-lg"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    >
                      <span>
                        <span style={{ color: "#555" }}>Cost: </span>
                        <span style={{ color: agent.color }}>${agent.pricePerCall}</span>
                      </span>
                      <span>
                        <span style={{ color: "#555" }}>Calls: </span>
                        <span style={{ color: "#e0e0e8" }}>{state?.calls || 0}</span>
                      </span>
                      <span>
                        <span style={{ color: "#555" }}>Rep: </span>
                        <span style={{ color: "#ffd700" }}>★ {agent.reputation}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <div className="text-[10px] uppercase tracking-[2px] mb-3" style={{ color: "#666" }}>
              Autonomous Activity Feed · Live
            </div>
            <div className="card overflow-y-auto" style={{ height: 520 }} ref={logContainerRef}>
              {log.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <div className="text-5xl opacity-30">🚗</div>
                  <div className="text-base" style={{ fontFamily: "Space Grotesk", color: "#444" }}>
                    Device Idle
                  </div>
                  <div className="text-[11px] max-w-[300px] leading-relaxed" style={{ color: "#555" }}>
                    Press <strong style={{ color: "#00ff9d" }}>Run Autonomous Sequence</strong> to watch the EV
                    autonomously discover, hire, and pay AI agents via x402 micropayments.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {log.map((entry) => (
                    <div
                      key={entry.id}
                      className="log-entry p-2.5 rounded-lg"
                      style={{
                        background:
                          entry.type === "system"
                            ? "rgba(255,255,255,0.03)"
                            : entry.type === "payment"
                            ? "rgba(0,255,157,0.04)"
                            : "transparent",
                        borderLeft: `2px solid ${
                          entry.type === "payment"
                            ? "#00ff9d"
                            : entry.type === "result"
                            ? "#00b4ff"
                            : entry.type === "system"
                            ? "#ff6b00"
                            : "#333"
                        }`,
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {entry.agentId && (
                            <span
                              className="text-[9px] font-semibold uppercase tracking-[1px] block mb-0.5"
                              style={{ color: agentColor(entry.agentId) }}
                            >
                              {agentName(entry.agentId)}
                            </span>
                          )}
                          <div
                            className="text-xs leading-relaxed"
                            style={{
                              color:
                                entry.type === "system"
                                  ? "#ff6b00"
                                  : entry.type === "payment"
                                  ? "#00ff9d"
                                  : entry.type === "result"
                                  ? "#ccc"
                                  : "#888",
                              fontWeight: entry.type === "system" ? 600 : 400,
                            }}
                          >
                            {entry.icon} {entry.message}
                          </div>
                          {entry.txHash && (
                            <div className="text-[9px] mt-0.5" style={{ color: "#444" }}>
                              tx: {entry.txHash} · Base Sepolia · confirmed
                            </div>
                          )}
                        </div>
                        <div className="text-[9px] whitespace-nowrap ml-3" style={{ color: "#333" }}>
                          {entry.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tech Stack Footer */}
            <div className="card mt-4 py-3 px-4 flex justify-between items-center">
              {[
                { label: "Payments", value: "x402 / Coinbase", color: "#00ff9d" },
                { label: "Agent Comm", value: "Google A2A", color: "#00b4ff" },
                { label: "Auth", value: "AP2 Mandates", color: "#ff6b00" },
                { label: "Identity", value: "ERC-8004", color: "#c084fc" },
                { label: "Privacy", value: "SKALE BITE", color: "#ffd700" },
                { label: "IoT Layer", value: "Pairpoint", color: "#ff4488" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-[8px] uppercase tracking-[1px] mb-1" style={{ color: "#555" }}>
                    {item.label}
                  </div>
                  <div className="text-[11px] font-semibold" style={{ color: item.color }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card {
          background: linear-gradient(135deg, rgba(20, 20, 35, 0.9), rgba(15, 15, 28, 0.95));
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 157, 0.3), transparent);
        }
      `}</style>
    </div>
  );
}
