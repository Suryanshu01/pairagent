# 🔗 PairAgent — Autonomous IoT Commerce Engine

**IoT devices that autonomously discover, hire, and pay AI agents via x402 micropayments.**

> "In the Economy of Things, 3.3 billion devices will transact by 2030. PairAgent makes that possible today."

![PairAgent](https://img.shields.io/badge/x402-Payment%20Protocol-00ff9d) ![A2A](https://img.shields.io/badge/Google-A2A%20%2B%20AP2-4285F4) ![ERC-8004](https://img.shields.io/badge/ERC--8004-Trustless%20Agents-c084fc) ![SKALE](https://img.shields.io/badge/SKALE-BITE%20Privacy-00b4ff) ![Pairpoint](https://img.shields.io/badge/Pairpoint-IoT%20Identity-ff4488)

---

## 🎯 Problem

Autonomous machines — EVs, drones, sensors, robots — need services to operate: route planning, pricing data, weather intelligence, slot booking. Today, these require human intervention or rigid pre-configured APIs.

**There is no standard way for a machine to:**
- Discover available service agents
- Evaluate their trustworthiness
- Hire them on-demand
- Pay them autonomously per-use

## 💡 Solution

PairAgent is an autonomous commerce engine for IoT devices. It enables any connected device to:

1. **Discover** AI agents via ERC-8004's on-chain Identity Registry
2. **Evaluate** agent reputation via ERC-8004's Reputation Registry
3. **Hire** agents through Google's A2A protocol for agent-to-agent communication
4. **Authorize** spending via AP2 Intent Mandates (cryptographic proof of intent)
5. **Pay** per-use via x402 micropayments on SKALE (gasless, private)
6. **Verify** identity via Pairpoint SIM-based device identity

All of this happens **autonomously** — no human in the loop.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PairAgent EV Device                       │
│  ┌───────────────┐   ┌─────────────────────────────────┐   │
│  │ Pairpoint SIM │   │  AI Orchestrator Brain (LLM)    │   │
│  │ Device Identity│──▶│  Analyzes state → Creates plan  │   │
│  └───────────────┘   │  Decides which agents to hire   │   │
│                      └──────────┬──────────────────────┘   │
│                                 │                           │
│  ┌──────────────────────────────▼──────────────────────┐   │
│  │              Agent Wallet (Base Sepolia)              │   │
│  │              USDC Balance · x402 Client               │   │
│  └──────────────────────────────┬──────────────────────┘   │
└─────────────────────────────────┼───────────────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │         x402 Payment Layer (HTTP)            │
           │      "Pay-per-request via HTTP 402"          │
           └──────────────────────┬──────────────────────┘
                                  │
    ┌─────────────┬───────────────┼───────────────┬──────────────┐
    ▼             ▼               ▼               ▼              │
┌────────┐  ┌─────────┐  ┌──────────┐  ┌──────────────┐        │
│⚡ Charge│  │🗺️ Route │  │🌦️ Weather│  │📅 Slot       │        │
│ Pricer │  │ Finder  │  │  Sense   │  │ Negotiator   │        │
│$0.002  │  │$0.005   │  │$0.001    │  │$0.003 (A2A)  │        │
└────┬───┘  └────┬────┘  └────┬─────┘  └──────┬───────┘        │
     │           │            │               │                 │
     └───────────┴────────────┴───────────────┘                 │
                              │                                 │
              ┌───────────────▼──────────────────┐              │
              │      ERC-8004 Trust Layer         │              │
              │  Identity · Reputation · Validate │              │
              │      (Ethereum Mainnet)           │              │
              └───────────────┬──────────────────┘              │
                              │                                 │
              ┌───────────────▼──────────────────┐              │
              │         SKALE Network             │              │
              │   Gasless · BITE Privacy          │              │
              │   Encrypted until settlement      │              │
              └──────────────────────────────────┘
```

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Payments** | x402 / Coinbase | HTTP-native micropayments (USDC) |
| **Agent Communication** | Google A2A | Agent-to-agent discovery & messaging |
| **Authorization** | Google AP2 | Intent Mandates for spending authorization |
| **Trust & Identity** | ERC-8004 | On-chain agent registry & reputation |
| **Privacy** | SKALE BITE | Encrypted transactions until finality |
| **IoT Identity** | Pairpoint (Vodafone) | SIM-based device identity & auth |
| **AI Brain** | OpenAI / Claude | LLM-powered autonomous decision-making |
| **Frontend** | Next.js 14 + Tailwind | Real-time dashboard |
| **Settlement** | Base Sepolia | On-chain USDC payment settlement |

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/pairagent.git
cd pairagent

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **"Run Autonomous Sequence"** to watch the EV autonomously hire and pay agents.

## 🎬 Demo Scenarios

### 1. Low Battery Charge Sequence
The EV detects low battery and autonomously:
- Hires AtmoSense to check weather impact on efficiency
- Hires ChargePricer to find cheapest station
- Hires PathFinder to compute energy-optimal route
- Hires SlotNegotiator to reserve a bay via A2A

### 2. Scheduled Maintenance
The EV has a diagnostic window and autonomously:
- Compares diagnostic service rates
- Checks weather for outdoor feasibility
- Finds covered facility with available agents
- Books a slot and hires diagnostic agent

### 3. Fleet Optimization
Fleet AI detects a demand surge and autonomously:
- Analyzes positioning vs. demand
- Evaluates repositioning cost vs. revenue
- Verifies route conditions
- Pre-books priority pickup zone

## 🔐 How x402 Payments Work

```
EV Agent                    Service Agent API
    │                              │
    │──── HTTP POST /pricing ─────▶│
    │                              │
    │◀── HTTP 402 Payment Required │  ← "Pay $0.002 USDC to 0x..."
    │                              │
    │──── Signs USDC payment ─────▶│  ← Automatic, no human
    │                              │
    │◀── 200 OK + pricing data ───│  ← Data delivered
    │                              │
    └──────── settled on Base ─────┘
```

Every agent call is a real economic transaction. The EV pays only for what it uses.

## 🌍 Why This Matters

- **Vodafone Pairpoint** projects 3.3B devices trading by 2030
- **x402** has processed 140M+ transactions since launch
- **ERC-8004** went live on Ethereum mainnet Jan 29, 2026
- **Google AP2** is backed by 60+ payments industry partners

PairAgent is the first project to combine all of these into a working autonomous commerce engine for IoT devices.

## 📜 Hackathon Tracks

- **Overall Track: Best Agentic App / Agent**
- **Agentic Tool Usage on x402**
- **Best Trading / DeFi Agent / AI Agent**

## 👤 Team

Solo builder — [Your Name]

## 📄 License

MIT
