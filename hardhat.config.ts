import "dotenv/config"
import "@nomiclabs/hardhat-etherscan"
import "@nomiclabs/hardhat-solhint"
import "@tenderly/hardhat-tenderly"
import "@nomiclabs/hardhat-waffle"
import "hardhat-abi-exporter"
import "hardhat-deploy"
import "hardhat-deploy-ethers"
import "hardhat-gas-reporter"
import "hardhat-spdx-license-identifier"
import "hardhat-typechain"
import "hardhat-watcher"
import "solidity-coverage"

import { HardhatUserConfig } from "hardhat/types"
import { removeConsoleLog } from "hardhat-preprocessor"
const defaultNetwork = "localhost";

const config: HardhatUserConfig = {
  defaultNetwork,

  mocha: {
    timeout: 20000,
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
    treasury: {
      default: 0
    }
  },
  etherscan: {
    apiKey: 'ZG3GNW27H3216I9X5JGRXIJWX25CZDABFZ'
  },
  paths: {
    tests: "test"
  },
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
      //
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
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true,
  },
  preprocess: {
    eachLine: removeConsoleLog((bre) => bre.network.name !== "hardhat" && bre.network.name !== "localhost"),
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  watcher: {
    compile: {
      tasks: ["compile"],
      files: ["./contracts"],
      verbose: true,
    },
  },
};

export default config