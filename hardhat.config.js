require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    pentestnet: {
      url: `https://rpc-testnet.pentagon.games`,
      accounts: [process.env.PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 8000000000,
      timeout: 1000000
    },
    penmainnet: {
      url: `https://rpc.pentagon.games`,
      accounts: [process.env.PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 8000000000,
      timeout: 1000000
    },
    polygonamoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80002, 
    },
  },

  etherscan: {
    apiKey: {
      mainnet: process.env.ETH_API_KEY,
      coretestnet: process.env.CORE_TESTNET_API_KEY,
      polygonamoy: process.env.AMOY_API_KEY,
      arbitrumOne: process.env.ARB_API_KEY,
      polygon: process.env.AMOY_API_KEY,
      bsc: process.env.BNB_API_KEY,
      xai: process.env.XAI_API_KEY,
      pentestnet: 'pentestnet',
      penmainnet: 'penmainnet',
      avalanche: 'avalanche',
      nebula: 'nebula'
    },
    customChains: [
      {
        network: "penmainnet",
        chainId: 3344,
        urls: {
          apiURL: "https://explorer.pentagon.games/api",
          browserURL: "https://explorer.pentagon.games/"
        }
      },
      {
        network: "pentestnet",
        chainId: 555555,
        urls: {
          apiURL: "https://explorer-testnet.pentagon.games/api",
          browserURL: "https://explorer-testnet.pentagon.games/"
        }
      },
      {
        network: "polygonamoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      }
    ]
  }
};
