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

import "./scripts/debugging/getbalances.ts"
import "./scripts/debugging/getaddresses.ts"

import "./scripts/transferOwnership.ts"

import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";

import { HardhatUserConfig } from "hardhat/types";
import { removeConsoleLog } from "hardhat-preprocessor";

const defaultNetwork = "localhost";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const ADMIN_PKEY = process.env.ADMIN_PKEY || "";
const ADMIN_PKEY_TESTNET = process.env.ADMIN_PKEY_TESTNET || "";
const ADMIN_PKEY_TESTNET_SCHAIN2 = process.env.ADMIN_PKEY_NEW_SCHAIN || "";

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
      europa: "0xfE3fd4C4bb91800347Cb4eE367332f417E70eb4a"
    },
    management: {
      default: 0,
      europa: "0x60592CB8ceD45A2dc432CB1Fe49c2Fa1a6bfa423"
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
      saveDeployments: false,
      /*
        notice no mnemonic here? it will just use account 0 of the hardhat node to deploy
        (you can put in a mnemonic here to set the deployer locally)
      */
    },
    rubyNewChain: {
      url: "https://testnet-proxy.skalenodes.com/v1/fancy-rasalhague",
      accounts: [ADMIN_PKEY_TESTNET],
    },
    testSchainv2: {
      url: "https://testnet-proxy.skalenodes.com/v1/whispering-turais",
      accounts: [ADMIN_PKEY_TESTNET_SCHAIN2],
    },
    europa: {
      url: "https://mainnet.skalenodes.com/v1/elated-tan-skat",
      accounts: [ADMIN_PKEY],
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/e0c8e6a9d33f42daafaac936d706c9d2",
      accounts: [ADMIN_PKEY],
      // gasPrice: 50000000000,  // wei
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/e0c8e6a9d33f42daafaac936d706c9d2",
      accounts: [ADMIN_PKEY_TESTNET],
      gasPrice: 50000000000,  // wei
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
