const hre = require("hardhat");
const { ethers } = hre;
require("dotenv/config");

/// Demo script: Mint NFT → List at low price → Sniper auto-buys via Reactivity
async function main() {
  const [deployer] = await ethers.getSigners();
  const nftAddr = process.env.NFT_ADDRESS!;
  const marketAddr = process.env.MARKETPLACE_ADDRESS!;
  const sniperAddr = process.env.SNIPER_ADDRESS!;

  if (!nftAddr || !marketAddr || !sniperAddr) {
    throw new Error("Set NFT_ADDRESS, MARKETPLACE_ADDRESS, SNIPER_ADDRESS in .env");
  }

  const nft = await ethers.getContractAt("SimpleNFT", nftAddr);
  const marketplace = await ethers.getContractAt("SimpleMarketplace", marketAddr);

  console.log("=== Somnia Sniper Demo ===\n");

  // 1. Mint a new NFT
  console.log("1. Minting NFT...");
  const mintTx = await nft.mint(deployer.address);
  const mintReceipt = await mintTx.wait();
  const tokenId = mintReceipt?.logs[0]?.topics?.[3];
  console.log(`   Minted token #${BigInt(tokenId!)}`);

  // 2. Approve marketplace
  console.log("2. Approving marketplace...");
  const approveTx = await nft.approve(marketAddr, BigInt(tokenId!));
  await approveTx.wait();

  // 3. List at a "mistake" price (very low)
  const mistakePrice = ethers.parseEther("0.001"); // Way below floor
  console.log(`3. Listing at ${ethers.formatEther(mistakePrice)} STT (mistake price!)...`);
  const listTx = await marketplace.list(nftAddr, BigInt(tokenId!), mistakePrice);
  const listReceipt = await listTx.wait();
  console.log("   Listed! Tx:", listReceipt?.hash);

  // 4. Wait for Reactivity to trigger sniper
  console.log("\n4. Waiting for Reactivity to trigger SniperHandler...");
  console.log("   (The sniper should auto-buy in the same or next block)");

  // Check after a few seconds
  await new Promise((r) => setTimeout(r, 15000));

  const sniper = await ethers.getContractAt("SniperHandler", sniperAddr);
  const totalSniped = await sniper.totalSniped();
  const totalSpent = await sniper.totalSpent();

  console.log(`\n=== Results ===`);
  console.log(`Total sniped: ${totalSniped}`);
  console.log(`Total spent:  ${ethers.formatEther(totalSpent)} STT`);

  // Check who owns the NFT now
  const newOwner = await nft.ownerOf(BigInt(tokenId!));
  if (newOwner === sniperAddr) {
    console.log(`✅ Sniper owns the NFT! Auto-buy succeeded.`);
  } else {
    console.log(`Owner: ${newOwner}`);
    console.log(`(Sniper may not have triggered yet — check subscription)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
