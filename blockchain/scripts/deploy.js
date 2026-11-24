const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--------------------------------------------------");
  console.log("Deploying CertificateVerification smart contract...");
  console.log("--------------------------------------------------");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${hre.ethers.formatEther(balance)} ETH`);

  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
  const certVerify = await CertificateVerification.deploy();
  await certVerify.waitForDeployment();

  const contractAddress = await certVerify.getAddress();
  console.log(`\n>>> CertificateVerification successfully deployed to: ${contractAddress} <<<\n`);
  console.log(`Contract Owner: ${await certVerify.owner()}`);

  // Save contract address and ABI for backend and frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/CertificateVerification.sol/CertificateVerification.json");
  const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    contractAddress: contractAddress,
    ownerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: contractArtifact.abi,
  };

  // 1. Save in blockchain directory
  const deployedPath = path.join(__dirname, "../deployed-contract.json");
  fs.writeFileSync(deployedPath, JSON.stringify(deploymentData, null, 2));
  console.log(`Saved deployment info to: ${deployedPath}`);

  // 2. Also export to backend config if directory exists
  const backendConfigDir = path.join(__dirname, "../../backend/config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(backendConfigDir, "contractData.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log(`Exported deployment info to backend: ${path.join(backendConfigDir, "contractData.json")}`);

  // 3. Also export to frontend src/contracts if directory exists
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendContractsDir, "contractData.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log(`Exported deployment info to frontend: ${path.join(frontendContractsDir, "contractData.json")}`);

  console.log("--------------------------------------------------");
  console.log("Deployment completed successfully!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

