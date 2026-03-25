const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy SimpleNFT
  const NFT = await ethers.getContractFactory("SimpleNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  console.log("SimpleNFT:", await nft.getAddress());

  // Deploy SimpleMarketplace
  const Marketplace = await ethers.getContractFactory("SimpleMarketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();
  console.log("SimpleMarketplace:", await marketplace.getAddress());

  // Mint some demo NFTs
  const tx = await nft.batchMint(deployer.address, 10);
  await tx.wait();
  console.log("Minted 10 demo NFTs");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
