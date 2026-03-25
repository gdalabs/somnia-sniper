# Somnia Sniper

Reactive NFT Sniper — instant mispriced NFT detection and auto-sniping powered by [Somnia Reactivity](https://docs.somnia.network/developer/reactivity).

![License](https://img.shields.io/badge/license-MIT-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.30-363636)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

> Built for the [Somnia Reactivity Mini Hackathon](https://dorahacks.io/hackathon/somnia-reactivity) on DoraHacks.

## Problem

When an NFT is listed at a mistakenly low price on a marketplace, traditional bots rely on **polling** — repeatedly querying the blockchain every few seconds. This creates:

- **Latency** — up to several seconds of delay before detecting the listing
- **Wasted RPC calls** — thousands of empty queries when nothing changes
- **Race conditions** — multiple bots competing on the same polling interval

## Solution

Somnia Sniper uses **Somnia Reactivity** to eliminate polling entirely. When a `Listed` event fires on the marketplace contract, the Somnia chain's validators **push** the event directly to our handler — enabling auto-buy **in the same block**.

```
Seller lists NFT at wrong price
        ↓
Marketplace emits Listed event
        ↓  Somnia Reactivity (push, not poll)
SniperHandler._onEvent() fires
        ↓  same block
Price check → auto buy() → NFT acquired
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Somnia Testnet (Chain ID: 50312)               │
│                                                 │
│  SimpleMarketplace ──Listed──→ Reactivity       │
│       ↑ buy()                  Precompile       │
│       │                        (0x0100)          │
│  SniperHandler ←──_onEvent()────┘               │
│  (on-chain auto-buy)                            │
│                                                 │
└─────────────────────────────────────────────────┘
        ↕ WebSocket
┌─────────────────────────────────────────────────┐
│  Off-chain Bot (TypeScript)                     │
│  └─ Monitor + log + dashboard feed              │
│                                                 │
│  Dashboard (Vite PWA)                           │
│  └─ Real-time listing feed + snipe history      │
└─────────────────────────────────────────────────┘
```

### Components

| Component | Description |
|---|---|
| **SimpleNFT** | Minimal ERC-721 for demo |
| **SimpleMarketplace** | List/buy/cancel with `Listed` event |
| **SniperHandler** | On-chain reactive handler — auto-buys underpriced NFTs via `_onEvent()` |
| **Bot** (`bot/index.ts`) | Off-chain monitor — creates Reactivity subscription + WebSocket listener |
| **Dashboard** (`src/`) | Vite + TypeScript dashboard — live listing feed, snipe stats |

## Quick Start

### Prerequisites

- Node.js 18+
- Somnia testnet STT tokens ([faucet](https://testnet.somnia.network/))
- A wallet with 32+ STT (required for on-chain Reactivity subscriptions)

### Setup

```bash
git clone https://github.com/gdalabs/somnia-sniper.git
cd somnia-sniper
npm install

cp .env.example .env
# Edit .env with your private key
```

### Deploy

```bash
# 1. Deploy NFT + Marketplace contracts
npm run deploy:marketplace

# 2. Copy addresses to .env (MARKETPLACE_ADDRESS, NFT_ADDRESS)

# 3. Deploy SniperHandler
npm run deploy:sniper

# 4. Copy SNIPER_ADDRESS to .env
```

### Run

```bash
# Start the bot (creates Reactivity subscription + monitors)
npm run bot

# Start the dashboard (port 5175)
npm run dev
# Open http://localhost:5175?demo for demo mode
```

### Demo

```bash
# Run the full demo: mint → list at mistake price → watch sniper auto-buy
npx hardhat run scripts/demo.ts --network somnia
```

## Why Reactivity > Polling

| Aspect | Polling | Somnia Reactivity |
|---|---|---|
| Detection speed | 1–10s delay | Same block |
| RPC usage | Thousands of calls/min | Zero (push-based) |
| Reliability | Can miss events between polls | Guaranteed delivery |
| Server dependency | Requires always-on server | On-chain handler runs autonomously |
| Cost | High RPC costs | Gas only on actual events |

## Tech Stack

- **Contracts**: Solidity 0.8.30, Hardhat, OpenZeppelin, `@somnia-chain/reactivity-contracts`
- **Bot**: TypeScript, viem, `@somnia-chain/reactivity` SDK
- **Dashboard**: Vite, TypeScript (Vanilla)
- **Chain**: Somnia Testnet (Chain ID: 50312)

## Project Structure

```
somnia-sniper/
├── contracts/
│   ├── SimpleNFT.sol          # Demo ERC-721
│   ├── SimpleMarketplace.sol  # Marketplace with Listed event
│   └── SniperHandler.sol      # On-chain reactive sniper
├── scripts/
│   ├── deploy-marketplace.ts  # Deploy NFT + marketplace
│   ├── deploy-sniper.ts       # Deploy sniper handler
│   └── demo.ts                # End-to-end demo script
├── bot/
│   └── index.ts               # Off-chain monitor + subscription setup
├── src/
│   ├── main.ts                # Dashboard UI
│   └── style.css              # Dashboard styling
├── hardhat.config.ts
└── vite.config.ts
```

## License

MIT — [GDA Labs](https://github.com/gdalabs)
