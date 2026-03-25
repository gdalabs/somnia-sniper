const hre = require("hardhat");
const { ethers } = hre;
require("dotenv/config");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const marketplaceAddr = process.env.MARKETPLACE_ADDRESS;
  if (!marketplaceAddr) throw new Error("Set MARKETPLACE_ADDRESS in .env");

  // Max price: 0.5 STT (configurable)
  const maxPrice = ethers.parseEther(process.env.MAX_PRICE_STT || "0.5");

  const Sniper = await ethers.getContractFactory("SniperHandler");
  const sniper = await Sniper.deploy(marketplaceAddr, maxPrice);
  await sniper.waitForDeployment();
  const sniperAddr = await sniper.getAddress();
  console.log("SniperHandler:", sniperAddr);

  // Fund sniper with remaining STT (keep 0.1 for gas)
  const balance = await ethers.provider.getBalance(deployer.address);
  const keep = ethers.parseEther("0.1");
  if (balance > keep) {
    const fundAmount = balance - keep;
    const fundTx = await deployer.sendTransaction({
      to: sniperAddr,
      value: fundAmount,
    });
    await fundTx.wait();
    console.log(`Funded sniper with ${ethers.formatEther(fundAmount)} STT`);
  } else {
    console.log("Low balance — fund the sniper manually later");
  }

  console.log("\nNext steps:");
  console.log("1. Add SNIPER_ADDRESS=" + sniperAddr + " to .env");
  console.log("2. Run: npm run bot (to create Reactivity subscription)");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
