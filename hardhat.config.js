require("@nomiclabs/hardhat-waffle");
require("@tenderly/hardhat-tenderly");
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
require('dotenv').config()


const defaultNetwork = "rinkeby";

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
      url: "https://mainnet.infura.io/v3/25fa1ace1a514064af1e74da27d00ff7",
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/25fa1ace1a514064af1e74da27d00ff7",
      // accounts: [process.env.ADMIN_PKEY_TESTNET]

      accounts: {
        mnemonic: process.env.MNEMONIC
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
    }
  },
};
