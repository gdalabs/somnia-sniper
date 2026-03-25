# Somnia Sniper — Demo Video Script

**Duration:** 2–3 minutes
**Tools:** QuickTime (screen recording) + terminal
**Resolution:** 1920x1080

---

## Scene 1: Title (5s)

**Screen:** Dashboard at `localhost:5175` — dark mode, empty state

**Narration (text overlay or voiceover):**
> Somnia Sniper — Reactive NFT Sniper
> Built with Somnia Reactivity by GDA Labs

---

## Scene 2: The Problem (15s)

**Screen:** Split view — left side shows a simple diagram/slide

**Text overlay:**
> Traditional NFT bots use **polling** — asking "any new listings?" every few seconds.
>
> This means:
> - Seconds of delay before detection
> - Thousands of wasted RPC calls
> - Missed opportunities

---

## Scene 3: The Solution (15s)

**Screen:** Architecture diagram (from README)

**Text overlay:**
> Somnia Reactivity **pushes** events directly to our smart contract.
>
> When a mispriced NFT is listed,
> the sniper auto-buys it **in the same block**.
>
> No polling. No delay. No server needed.

---

## Scene 4: Deploy (30s)

**Screen:** Terminal — full screen

**Action:** Run deploy commands (pre-recorded or live)

```
$ npm run deploy:marketplace

Deploying with: 0x...
SimpleNFT:         0x1234...
SimpleMarketplace: 0x5678...
Minted 10 demo NFTs

$ npm run deploy:sniper

Deploying with: 0x...
SniperHandler: 0x9abc...
Funded sniper with 5 STT
```

**Text overlay:**
> Deploy marketplace + sniper contracts to Somnia Testnet

---

## Scene 5: Start the Bot (15s)

**Screen:** Terminal

**Action:**
```
$ npm run bot

=== Somnia Reactive NFT Sniper ===
  by GDA Labs

Wallet: 0x...
Balance: 37.5 STT
Setting up on-chain Reactivity subscription...
  Marketplace: 0x5678...
  Sniper:      0x9abc...
On-chain subscription created! ID: 42

Starting off-chain WebSocket monitor...
Off-chain monitor active. Listening for listings...

Bot running. Press Ctrl+C to stop.
```

**Text overlay:**
> Reactivity subscription created — sniper is armed

---

## Scene 6: Open Dashboard (10s)

**Screen:** Browser — navigate to `localhost:5175?demo`

**Action:** Show the dashboard with "LIVE" indicator pulsing, stats at zero, "Waiting for listings..."

**Text overlay:**
> Real-time dashboard monitors all marketplace activity

---

## Scene 7: The Snipe (40s) ⭐ KEY SCENE

**Screen:** Split — Terminal (left 40%) + Dashboard (right 60%)

**Action — Terminal:**
```
$ npx hardhat run scripts/demo.ts --network somnia

=== Somnia Sniper Demo ===

1. Minting NFT...
   Minted token #10
2. Approving marketplace...
3. Listing at 0.001 STT (mistake price!)...
   Listed! Tx: 0xabc...

4. Waiting for Reactivity to trigger SniperHandler...
```

**Action — Dashboard:** (simultaneously)
- New listing appears with slide-in animation
- Price shows "0.001 STT" in green
- Badge flashes "SNIPED" ✅
- Stats update: Sniped: 1, Total Spent: 0.001 STT

**Action — Terminal (continued):**
```
=== Results ===
Total sniped: 1
Total spent:  0.001 STT
✅ Sniper owns the NFT! Auto-buy succeeded.
```

**Text overlay:**
> Listed at 0.001 STT → Sniped in the SAME BLOCK
> No polling. No delay. Pure Reactivity.

---

## Scene 8: Multiple Snipes (20s)

**Screen:** Dashboard full screen

**Action:** Run demo script 3–4 more times rapidly. Dashboard shows listings streaming in:

```
NFT #11  0.01  STT  → SNIPED
NFT #12  2.0   STT  → WATCHING (above threshold)
NFT #13  0.05  STT  → SNIPED
NFT #14  1.0   STT  → WATCHING
NFT #15  0.001 STT  → SNIPED
```

**Text overlay:**
> Only snipes listings below the configured max price.
> Expensive listings are monitored but ignored.

---

## Scene 9: Closing (15s)

**Screen:** Dashboard with final stats visible

**Text overlay:**
> Somnia Sniper
>
> ✅ Same-block detection & purchase
> ✅ Fully on-chain — no server required
> ✅ Configurable price threshold
> ✅ Real-time monitoring dashboard
>
> github.com/gdalabs/somnia-sniper
> Built by GDA Labs

---

## Recording Tips

1. **Font size:** Terminal font 16pt+, readable at 1080p
2. **Clean desktop:** Hide dock, menu bar icons
3. **Browser:** Hide bookmarks bar, use minimal extensions
4. **Pace:** Pause 2s between major actions so viewer can read
5. **Terminal theme:** Dark with green accent (match dashboard)
6. **No cursor jitter:** Use pre-typed commands with ↑ arrow or scripts
7. **Music:** Optional — lo-fi or electronic, keep it subtle

## Pre-recording Checklist

- [ ] Contracts deployed to Somnia testnet
- [ ] `.env` filled with all addresses
- [ ] Bot running and subscription active
- [ ] Dashboard open at `localhost:5175`
- [ ] Terminal font size increased
- [ ] QuickTime screen recording ready
- [ ] Demo script commands pre-typed or aliased
