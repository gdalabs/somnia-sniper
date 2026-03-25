import "dotenv/config";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  keccak256,
  toBytes,
  type Hex,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { SDK } from "@somnia-chain/reactivity";

// Somnia testnet chain definition
const somniaTestnet = {
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network/"] },
  },
  blockExplorers: {
    default: {
      name: "Shannon Explorer",
      url: "https://shannon-explorer.somnia.network",
    },
  },
} as const;

// Config from env
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
const MARKETPLACE = process.env.MARKETPLACE_ADDRESS as Address;
const SNIPER = process.env.SNIPER_ADDRESS as Address;

if (!PRIVATE_KEY || !MARKETPLACE || !SNIPER) {
  console.error("Missing env vars. Copy .env.example to .env and fill in values.");
  process.exit(1);
}

const LISTED_SIG = keccak256(
  toBytes("Listed(uint256,address,uint256,address,uint256)")
);

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: somniaTestnet,
  transport: http(),
});

// Stats
let listingsDetected = 0;
let snipesAttempted = 0;
const startTime = Date.now();

interface ListingEvent {
  listingId: bigint;
  nftContract: Address;
  tokenId: bigint;
  seller: Address;
  price: bigint;
  timestamp: number;
}

const recentListings: ListingEvent[] = [];

async function setupOnChainSubscription() {
  console.log("Setting up on-chain Reactivity subscription...");
  console.log(`  Marketplace: ${MARKETPLACE}`);
  console.log(`  Sniper:      ${SNIPER}`);

  const sdk = new SDK({
    public: publicClient,
    wallet: walletClient,
  });

  try {
    const txHash = await sdk.createSoliditySubscription({
      handlerContractAddress: SNIPER,
      emitter: MARKETPLACE,
      eventTopics: [LISTED_SIG as `0x${string}`],
      gasLimit: 3_000_000n,
      priorityFeePerGas: 2_000_000_000n, // 2 gwei
      maxFeePerGas: 10_000_000_000n, // 10 gwei
      isGuaranteed: true,
      isCoalesced: false,
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const subId = BigInt(receipt.logs[0]?.topics?.[2] ?? "0");
    console.log(`On-chain subscription created! ID: ${subId}`);
    return subId;
  } catch (err) {
    console.error("Failed to create on-chain subscription:", err);
    return null;
  }
}

async function setupOffChainMonitor() {
  console.log("\nStarting off-chain WebSocket monitor...");

  const sdk = new SDK({
    public: publicClient,
    wallet: walletClient,
  });

  const subscription = await sdk.subscribe({
    emitter: MARKETPLACE,
    eventTopics: [LISTED_SIG as `0x${string}`],
    onData: (data: any) => {
      listingsDetected++;
      const now = Date.now();

      console.log(`\n[${new Date().toISOString()}] New listing detected!`);
      console.log(`  Event data:`, JSON.stringify(data, null, 2));

      // Parse listing data if available
      try {
        const listing: ListingEvent = {
          listingId: BigInt(data.topics?.[1] ?? 0),
          nftContract: data.topics?.[2] as Address,
          tokenId: BigInt(data.topics?.[3] ?? 0),
          seller: data.data?.seller as Address,
          price: BigInt(data.data?.price ?? 0),
          timestamp: now,
        };

        recentListings.push(listing);
        if (recentListings.length > 100) recentListings.shift();

        console.log(`  Listing #${listing.listingId}`);
        console.log(`  Price: ${formatEther(listing.price)} STT`);
        console.log(`  NFT: ${listing.nftContract} #${listing.tokenId}`);
        console.log(
          `  → On-chain sniper will auto-buy if price ≤ threshold`
        );
      } catch {
        console.log("  (Could not parse listing details)");
      }
    },
  });

  console.log("Off-chain monitor active. Listening for listings...");
  return subscription;
}

function printStatus() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  console.log(`\n--- Status (uptime: ${uptime}s) ---`);
  console.log(`  Listings detected: ${listingsDetected}`);
  console.log(`  Recent listings:   ${recentListings.length}`);
  console.log(`  Snipes attempted:  ${snipesAttempted}`);
  console.log("---");
}

async function main() {
  console.log("=== Somnia Reactive NFT Sniper ===");
  console.log(`  by GDA Labs\n`);

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Wallet: ${account.address}`);
  console.log(`Balance: ${formatEther(balance)} STT`);

  if (balance < parseEther("32")) {
    console.warn(
      "⚠ Balance < 32 STT. On-chain subscriptions require 32+ STT."
    );
  }

  // Set up on-chain reactive subscription (auto-buy)
  await setupOnChainSubscription();

  // Set up off-chain monitor (logging + dashboard feed)
  await setupOffChainMonitor();

  // Status printer
  setInterval(printStatus, 30_000);

  // Keep alive
  console.log("\nBot running. Press Ctrl+C to stop.");
}

main().catch(console.error);
