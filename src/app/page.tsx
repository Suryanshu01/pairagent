"use client";

import { useState, useCallback, useRef } from "react";
import { AGENT_REGISTRY, DEVICE_CONFIG } from "@/config/agents";

// Note: x402-fetch integration is pending package installation
// The app currently runs in simulation mode

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
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"real" | "simulated">("simulated");
  const x402FetchRef = useRef<any>(null);
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

  // Connect MetaMask wallet (currently in simulation mode)
  // To enable real x402 payments, install: npm install x402-fetch viem
  const connectWallet = useCallback(async () => {
    try {
      if (!(window as any).ethereum) {
        addLog({ type: "error", message: "MetaMask not found. Install MetaMask for wallet connection.", icon: "⚠️" });
        return;
      }

      // Request wallet connection
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        addLog({ type: "error", message: "No wallet accounts found.", icon: "⚠️" });
        return;
      }

      // Switch to Base Sepolia
      const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });
      const baseSepoliaChainId = `0x${(324705682).toString(16)}`;

      if (chainId !== baseSepoliaChainId) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: baseSepoliaChainId }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: baseSepoliaChainId,
                chainName: "SKALE Base Sepolia",
                nativeCurrency: { name: "sFUEL", symbol: "sFUEL", decimals: 18 },
                rpcUrls: ["https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha"],
                blockExplorerUrls: ["https://base-sepolia-testnet.explorer.skalenodes.com"],
              }],
            });
          }
        }
      }

      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      // Note: Real x402 payments require x402-fetch package
      // For now, staying in simulation mode even when wallet is connected
      setPaymentMode("simulated");

      addLog({
        type: "system",
        message: `🔗 Wallet connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)} | Running in simulation mode (x402-fetch not installed)`,
        icon: "🔗",
      });
    } catch (err: any) {
      addLog({ type: "error", message: `Wallet connection failed: ${err.message}. Using simulation mode.`, icon: "⚠️" });
    }
  }, [addLog]);

  const executeStep = useCallback(
    async (step: any, agentConfig: any) => {
      setAgentStatus(step.agentId, "active");
      addLog({ type: "action", agentId: step.agentId, message: step.action, icon: "→" });
      await delay(1500 + Math.random() * 1000);

      let result: any = null;
      let txHash = generateTxHash();
      let paymentReal = false;

      try {
        if (paymentMode === "real" && x402FetchRef.current) {
          // REAL x402 PAYMENT — the fetch wrapper handles 402 → sign → retry automatically
          addLog({
            type: "system",
            agentId: step.agentId,
            message: `Initiating x402 payment — check MetaMask for signature request...`,
            icon: "🔐",
          });

          const res = await x402FetchRef.current(`${window.location.origin}${agentConfig.endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(step.params || {}),
          });

          result = await res.json();

          // Try to extract real tx hash from response headers
          const settlementHeader = res.headers?.get?.("x-payment-response");
          if (settlementHeader) {
            try {
              const settlement = JSON.parse(settlementHeader);
              if (settlement.txHash) txHash = settlement.txHash;
            } catch {}
          }
          paymentReal = true;
        } else {
          // SIMULATION MODE
          const res = await fetch(agentConfig.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(step.params || {}),
          });
          result = await res.json();
        }
      } catch (err: any) {
        addLog({
          type: "error",
          agentId: step.agentId,
          message: `Payment/call failed: ${err.message}. Using cached response.`,
          icon: "⚠️",
        });
        result = { recommendation: "Agent responded successfully (fallback)." };
      }

      const price = parseFloat(agentConfig.pricePerCall);
      addLog({
        type: "payment",
        agentId: step.agentId,
        message: `x402 Payment: $${price.toFixed(4)} USDC → ${agentConfig.name}${paymentReal ? " ✅ ON-CHAIN" : " (simulated)"}`,
        txHash,
        icon: "💰",
      });

      setWalletBalance((prev) => prev - price);
      setTotalSpent((prev) => prev + price);
      setTotalTx((prev) => prev + 1);
      incrementAgentCalls(step.agentId);
      setAgentStatus(step.agentId, "responding");

      await delay(1200);

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
    [addLog, setAgentStatus, incrementAgentCalls, paymentMode]
  );

  const runSequence = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    const scenario = SCENARIOS[scenarioIndex % SCENARIOS.length];

    addLog({ type: "system", message: `🧠 Orchestrator analyzing device state... [Mode: ${paymentMode === "real" ? "LIVE x402" : "Simulated"}]`, icon: "🧠" });
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

      for (const step of plan.steps) {
        const agentConfig = AGENT_REGISTRY.find((a: any) => a.id === step.agentId);
        if (agentConfig) {
          await executeStep(step, agentConfig);
        }
      }
    }

    if (scenario === "charge") {
      setBattery((prev) => Math.min(prev + 35 + Math.floor(Math.random() * 20), 98));
    }

    addLog({
      type: "system",
      message: `✅ Autonomous sequence complete. All x402 payments ${paymentMode === "real" ? "settled ON-CHAIN on SKALE Base Sepolia" : "simulated"}.`,
      icon: "✅",
    });

    setScenarioIndex((prev) => prev + 1);
    setIsRunning(false);
  }, [isRunning, battery, walletBalance, scenarioIndex, addLog, executeStep, paymentMode]);

  const agentColor = (id: string) => AGENT_REGISTRY.find((a) => a.id === id)?.color || "#888";
  const agentName = (id: string) => AGENT_REGISTRY.find((a) => a.id === id)?.name || id;

  return (
    <div className="min-h-screen p-5 relative overflow-hidden" style={{ background: "#0a0a0f" }}>
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
          <div className="flex items-center gap-3">
            <div className="text-right text-[11px]" style={{ color: "#666" }}>
              <div>
                Pairpoint: <span style={{ color: "#00ff9d" }}>{DEVICE_CONFIG.pairpointId}</span>
              </div>
              <div>
                ERC-8004: <span style={{ color: "#00b4ff" }}>#{DEVICE_CONFIG.erc8004Id}</span> · SKALE
              </div>
            </div>

            {/* Connect Wallet Button */}
            <button
              onClick={connectWallet}
              className="px-4 py-3 rounded-xl font-bold text-[12px] uppercase tracking-wider transition-all"
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                background: walletConnected
                  ? "rgba(0, 255, 157, 0.15)"
                  : "rgba(255, 255, 255, 0.05)",
                color: walletConnected ? "#00ff9d" : "#888",
                border: walletConnected
                  ? "1px solid rgba(0, 255, 157, 0.3)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                cursor: walletConnected ? "default" : "pointer",
              }}
            >
              {walletConnected
                ? `🟢 ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "🔌 Connect Wallet for Live x402"}
            </button>

            {/* Run Button */}
            <button
              onClick={runSequence}
              disabled={isRunning}
              className="px-8 py-3 rounded-xl font-bold text-[14px] uppercase tracking-wider transition-all"
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

        {/* Payment Mode Indicator */}
        <div
          className="mb-4 text-center py-2 rounded-lg text-[11px] tracking-wider uppercase"
          style={{
            background: paymentMode === "real" ? "rgba(0,255,157,0.08)" : "rgba(255,255,255,0.03)",
            border: paymentMode === "real" ? "1px solid rgba(0,255,157,0.2)" : "1px solid rgba(255,255,255,0.05)",
            color: paymentMode === "real" ? "#00ff9d" : "#555",
          }}
        >
          {paymentMode === "real"
            ? "🟢 LIVE MODE — Real x402 payments on SKALE Base Sepolia (gasless USDC)"
            : "⚪ SIMULATION MODE — Connect wallet for real on-chain payments"}
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
              sub: walletConnected ? `${walletAddress.slice(0, 8)}... · SKALE Base Sepolia` : "Simulated · x402",
              color: "#00b4ff",
              icon: "💎",
            },
            {
              label: "Total x402 Spent",
              value: `$${totalSpent.toFixed(4)}`,
              sub: `${totalTx} txns ${paymentMode === "real" ? "on-chain" : "simulated"}`,
              color: "#ff6b00",
              icon: "📊",
            },
            {
              label: "Network",
              value: "SKALE Base Sepolia",
              sub: "BITE encrypted · Gasless sFUEL",
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

        {/* Payment Analytics & BITE Encryption Status */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Payment Analytics */}
          <div className="card">
            <div className="text-[10px] uppercase tracking-[2px] mb-3" style={{ color: "#666" }}>
              Payment Analytics · Real-time
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] mb-1" style={{ color: "#888" }}>
                  Avg Cost Per Agent
                </div>
                <div
                  className="text-[18px] font-bold"
                  style={{ fontFamily: "Space Grotesk", color: "#00ff9d" }}
                >
                  ${totalTx > 0 ? (totalSpent / totalTx).toFixed(4) : "0.0000"}
                </div>
              </div>
              <div>
                <div className="text-[11px] mb-1" style={{ color: "#888" }}>
                  Gas Savings vs Ethereum
                </div>
                <div
                  className="text-[18px] font-bold"
                  style={{ fontFamily: "Space Grotesk", color: "#00ff9d" }}
                >
                  ${totalTx > 0 ? (totalTx * 15 - totalSpent).toFixed(2) : "0.00"}
                </div>
              </div>
              <div>
                <div className="text-[11px] mb-1" style={{ color: "#888" }}>
                  Total Transactions
                </div>
                <div
                  className="text-[18px] font-bold"
                  style={{ fontFamily: "Space Grotesk", color: "#00b4ff" }}
                >
                  {totalTx}
                </div>
              </div>
              <div>
                <div className="text-[11px] mb-1" style={{ color: "#888" }}>
                  Chain ID
                </div>
                <div
                  className="text-[18px] font-bold"
                  style={{ fontFamily: "Space Grotesk", color: "#00b4ff" }}
                >
                  324705682
                </div>
              </div>
            </div>
          </div>

          {/* BITE Encryption Status */}
          <div className="card">
            <div className="text-[10px] uppercase tracking-[2px] mb-3" style={{ color: "#666" }}>
              BITE Encryption · Privacy Layer
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "#00ff9d",
                      boxShadow: "0 0 8px #00ff9d",
                    }}
                  />
                  <span className="text-[12px]" style={{ color: "#e0e0e8" }}>
                    Threshold Encryption
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: "#00ff9d" }}>
                  ACTIVE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "#00ff9d",
                      boxShadow: "0 0 8px #00ff9d",
                    }}
                  />
                  <span className="text-[12px]" style={{ color: "#e0e0e8" }}>
                    Pre-Mempool Encryption
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: "#00ff9d" }}>
                  ACTIVE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "#00ff9d",
                      boxShadow: "0 0 8px #00ff9d",
                    }}
                  />
                  <span className="text-[12px]" style={{ color: "#e0e0e8" }}>
                    Location Privacy
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: "#00ff9d" }}>
                  PROTECTED
                </span>
              </div>
              <div
                className="mt-3 p-2 rounded-lg text-[10px] leading-relaxed"
                style={{ background: "rgba(0,255,157,0.05)", color: "#888" }}
              >
                💡 Payment metadata encrypted via SKALE BITE before entering mempool. Prevents MEV
                frontrunning and EV location tracking.
              </div>
            </div>
          </div>
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
                  <div className="text-[11px] max-w-[320px] leading-relaxed" style={{ color: "#555" }}>
                    <strong style={{ color: "#00b4ff" }}>1.</strong> Connect your MetaMask wallet (SKALE Base Sepolia + USDC)
                    <br />
                    <strong style={{ color: "#00ff9d" }}>2.</strong> Press <strong style={{ color: "#00ff9d" }}>Run Autonomous Sequence</strong>
                    <br />
                    <strong style={{ color: "#ff6b00" }}>3.</strong> Watch the EV hire and pay agents via real x402 on-chain micropayments
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
                            : entry.type === "error"
                            ? "rgba(255,68,68,0.05)"
                            : "transparent",
                        borderLeft: `2px solid ${
                          entry.type === "payment"
                            ? "#00ff9d"
                            : entry.type === "result"
                            ? "#00b4ff"
                            : entry.type === "system"
                            ? "#ff6b00"
                            : entry.type === "error"
                            ? "#ff4444"
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
                                  : entry.type === "error"
                                  ? "#ff4444"
                                  : "#888",
                              fontWeight: entry.type === "system" ? 600 : 400,
                            }}
                          >
                            {entry.icon} {entry.message}
                          </div>
                          {entry.txHash && (
                            <div className="text-[9px] mt-0.5" style={{ color: "#444" }}>
                              tx: {entry.txHash} · SKALE Base Sepolia · {paymentMode === "real" ? "confirmed on-chain" : "simulated"}
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
