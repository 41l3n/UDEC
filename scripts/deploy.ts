import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const EvidenceManager = await ethers.getContractFactory("EvidenceManager");
  const evidenceManager = await EvidenceManager.deploy(deployer.address);

  await evidenceManager.waitForDeployment();

  console.log("EvidenceManager deployed to:", await evidenceManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});