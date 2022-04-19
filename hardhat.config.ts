import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import '@openzeppelin/hardhat-upgrades';

import "hardhat-abi-exporter";

import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";
import "hardhat-spdx-license-identifier";
import "hardhat-watcher";
import "solidity-coverage";
import "@typechain/hardhat";
import "./scripts/lottery/createLottery.ts"
import "./scripts/lottery/drawLottery.ts"

import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";

import { HardhatUserConfig } from "hardhat/types";
import { removeConsoleLog } from "hardhat-preprocessor";
// const defaultNetwork = "skaleTestnet";
const defaultNetwork = "rinkeby";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const ADMIN_PKEY_TESTNET = process.env.ADMIN_PKEY_TESTNET || "";

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
      default: 0,
    },
  },
  etherscan: {
    apiKey: "ZG3GNW27H3216I9X5JGRXIJWX25CZDABFZ",
  },
  paths: {
    tests: "test",
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
      accounts: [ADMIN_PKEY_TESTNET],
      // accounts: {
      //   mnemonic: process.env.MNEMONIC,
      // },
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/e0c8e6a9d33f42daafaac936d706c9d2",
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/e0c8e6a9d33f42daafaac936d706c9d2",
      accounts: [ADMIN_PKEY_TESTNET],
      //
      // accounts: {
      //   mnemonic: process.env.MNEMONIC,
      // },
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
    eachLine: removeConsoleLog(bre => bre.network.name !== "hardhat" && bre.network.name !== "localhost"),
  },
  typechain: {
    outDir: "typechain",
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

export default config;
