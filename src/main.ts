interface Listing {
  id: number;
  nftContract: string;
  tokenId: number;
  seller: string;
  price: string;
  priceRaw: bigint;
  timestamp: number;
  status: "sniped" | "watching" | "missed";
}

interface Stats {
  totalListings: number;
  totalSniped: number;
  totalSpent: string;
  uptime: number;
  balance: string;
}

// Demo data for static dashboard (real data comes from bot WebSocket)
const demoListings: Listing[] = [];
const stats: Stats = {
  totalListings: 0,
  totalSniped: 0,
  totalSpent: "0",
  uptime: 0,
  balance: "—",
};

const app = document.getElementById("app")!;

function truncAddr(addr: string): string {
  if (addr.length < 10) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

function render() {
  app.innerHTML = `
    <header>
      <div>
        <h1>Somnia Sniper</h1>
        <div class="subtitle">Reactive NFT Sniper — powered by Somnia Reactivity</div>
      </div>
      <div class="status-bar">
        <span class="live">● LIVE</span>
        <span>Uptime: ${stats.uptime}s</span>
      </div>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="label">Listings Detected</div>
        <div class="value">${stats.totalListings}</div>
      </div>
      <div class="stat-card">
        <div class="label">Sniped</div>
        <div class="value">${stats.totalSniped}</div>
      </div>
      <div class="stat-card">
        <div class="label">Total Spent</div>
        <div class="value warning">${stats.totalSpent} STT</div>
      </div>
      <div class="stat-card">
        <div class="label">Bot Balance</div>
        <div class="value">${stats.balance} STT</div>
      </div>
    </div>

    <div class="config">
      <h2>Sniper Configuration</h2>
      <div class="config-row">
        <label>Max Price (STT)</label>
        <input type="text" id="maxPrice" value="0.5" />
      </div>
      <div class="config-row">
        <label>Marketplace</label>
        <input type="text" id="marketplace" value="" placeholder="0x..." />
      </div>
    </div>

    <div class="feed">
      <h2>Live Listings Feed</h2>
      ${
        demoListings.length === 0
          ? `<div class="empty">
              <div class="icon">📡</div>
              Waiting for listings...<br/>
              Deploy contracts and run the bot to see live data.
            </div>`
          : demoListings
              .slice()
              .reverse()
              .map(
                (l) => `
              <div class="listing ${l.status}">
                <div class="info">
                  <span class="nft-id">NFT #${l.tokenId}</span>
                  <span class="contract">${truncAddr(l.nftContract)} · Listing #${l.id}</span>
                  <span class="contract">Seller: ${truncAddr(l.seller)} · ${formatTime(l.timestamp)}</span>
                </div>
                <div style="text-align: right;">
                  <div class="price ${l.status === "sniped" ? "low" : "normal"}">${l.price} STT</div>
                  <span class="badge ${l.status}">${l.status === "sniped" ? "SNIPED" : "WATCHING"}</span>
                </div>
              </div>
            `
              )
              .join("")
      }
    </div>

    <footer>
      Built by <a href="https://github.com/gdalabs" target="_blank">GDA Labs</a> for
      <a href="https://dorahacks.io/hackathon/somnia-reactivity" target="_blank">Somnia Reactivity Hackathon</a>
    </footer>
  `;
}

// Simulate live data for demo/screenshot purposes
function addDemoListing() {
  const contracts = [
    "0x1037CC8ddDB8aC25B2dcD5dA7815b6c94930A6DB",
    "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD1e",
  ];
  const prices = [0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0];
  const price = prices[Math.floor(Math.random() * prices.length)];
  const isCheap = price <= 0.5;

  const listing: Listing = {
    id: demoListings.length,
    nftContract: contracts[Math.floor(Math.random() * contracts.length)],
    tokenId: Math.floor(Math.random() * 1000),
    seller: "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    price: price.toString(),
    priceRaw: BigInt(Math.floor(price * 1e18)),
    timestamp: Date.now(),
    status: isCheap ? "sniped" : "watching",
  };

  demoListings.push(listing);
  stats.totalListings++;
  if (isCheap) {
    stats.totalSniped++;
    stats.totalSpent = (
      parseFloat(stats.totalSpent) + price
    ).toFixed(3);
  }

  render();
}

// Check URL param for demo mode
const isDemo = new URLSearchParams(window.location.search).has("demo");

render();

if (isDemo) {
  // Add demo listings periodically
  setInterval(addDemoListing, 3000);
  setInterval(() => {
    stats.uptime += 1;
    render();
  }, 1000);
  // Initial data
  for (let i = 0; i < 3; i++) addDemoListing();
}

// Uptime counter
setInterval(() => {
  stats.uptime++;
}, 1000);
