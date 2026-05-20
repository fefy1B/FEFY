require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.24",

  networks: {
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [
        "0x851ad0fc811b227f0a7ee4dcc9f7915da9c5d2d78567a54d7c9eff6871b0deb7"
      ]
    }
  }
};