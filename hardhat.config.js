require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {

  solidity: "0.8.20",

  networks: {

    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },

    bsc: {
      url: process.env.BSC_MAINNET_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 56,
    },

  },

};