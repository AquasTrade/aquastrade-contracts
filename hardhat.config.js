require("@nomiclabs/hardhat-waffle");
require("@tenderly/hardhat-tenderly");
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
require('dotenv').config()


const defaultNetwork = "localhost";

module.exports = {
  defaultNetwork,

  networks: {
    localhost: {
      url: "http://localhost:8545",
      /*
        notice no mnemonic here? it will just use account 0 of the hardhat node to deploy
        (you can put in a mnemonic here to set the deployer locally)
      */
    },
    skaleTestnet: {
      url: "https://dappnet-api.skalenodes.com/v1/melodic-murzim",
      accounts: [process.env.ADMIN_PKEY_TESTNET]
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/460f40a260564ac4a4f4b3fffb032dad",
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },

  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
    dev: {
      default: 1,
      1: '0x5B4442cAdE5aD6e58FE864B9a58125065D01A74d' //skaleTestnet dev acc
    }
  },
};
