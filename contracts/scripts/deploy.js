const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying BountyEscrow contract...");
  const Escrow = await hre.ethers.getContractFactory("BountyEscrow");
  const escrow = await Escrow.deploy("Debug Global GenAI Escrow", { value: 0 });

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();
  
  console.log(`BountyEscrow deployed to: ${address}`);

  // Export ABI to frontend dynamically
  const artifactPath = path.join(__dirname, "../artifacts/contracts/BountyEscrow.sol/BountyEscrow.json");
  const artifact = require(artifactPath);
  
  // Ensure the frontend lib directory exists
  const frontendConfigDir = path.join(__dirname, "../../frontend/src/lib");
  if (!fs.existsSync(frontendConfigDir)) {
      fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  const frontendOutPath = path.join(frontendConfigDir, "BountyEscrow.json");
  
  fs.writeFileSync(frontendOutPath, JSON.stringify(artifact, null, 2));
  console.log("ABI exported successfully to frontend/src/lib/BountyEscrow.json");
  
  // Also create a small config file pointing to the deployed address
  const configPath = path.join(frontendConfigDir, "config.js");
  const configContent = `export const CONTRACT_ADDRESS = "${address}";\n`;
  fs.writeFileSync(configPath, configContent);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
