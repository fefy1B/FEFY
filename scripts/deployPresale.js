const hre = require("hardhat");

async function main() {

  const tokenAddress =
    "0xC26166825088453ce44537239cE90601b515F92f";

  const Presale =
    await hre.ethers.getContractFactory(
      "FEFYPresale"
    );

  const presale =
    await Presale.deploy(
      tokenAddress
    );

  await presale.waitForDeployment();

  console.log(
    "PRESALE:",
    await presale.getAddress()
  );

}

main().catch((error) => {

  console.error(error);

  process.exitCode = 1;

});