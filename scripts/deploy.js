const hre = require("hardhat");

async function main() {

  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);

  console.log("Account balance:",
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  const FEFYToken = await hre.ethers.getContractFactory("FEFYToken");

  const token = await FEFYToken.deploy(deployer.address);

  await token.waitForDeployment();

  console.log("FEFY Token deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});