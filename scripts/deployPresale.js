const hre = require("hardhat");

async function main() {

  const PRESALE =
    await hre.ethers.getContractFactory(
      "FEFYPresale"
    );

  const presale =
    await PRESALE.deploy(
      "0xF4DBF1a2c4108F2A6ab5aaF2eBF7be23EeC85578"
    );

  await presale.waitForDeployment();

  console.log(
    "PRESALE DEPLOYED TO:",
    await presale.getAddress()
  );
}

main().catch((error) => {

  console.error(error);

  process.exitCode = 1;

});