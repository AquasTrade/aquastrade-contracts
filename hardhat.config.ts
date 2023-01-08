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
      europa: "0xfE3fd4C4bb91800347Cb4eE367332f417E70eb4a",
      stagingv3: "0xD244519000000000000000000000000000000000"
    },
    management: {
      default: 0,
      europa: "0x60592CB8ceD45A2dc432CB1Fe49c2Fa1a6bfa423",
      stagingv3: "0xD244519000000000000000000000000000000000"
    },
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
    stagingv3: {
      url: "https://staging-v3.skalenodes.com/v1/staging-legal-crazy-castor",
      accounts: [ADMIN_PKEY_TESTNET],
    },
    rubyNewChain: {
      url: "http://staging-node0.skalenodes.com:10003",
      accounts: [ADMIN_PKEY_TESTNET],
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
    goerli: {
      url: "https://eth-goerli.gateway.pokt.network/v1/lb/f0c06ca797ece1fe09dcdf75",
      accounts: [ADMIN_PKEY_TESTNET],
      gasPrice: 50000000000,  // wei
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
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      europa: "acb",
      rubyNewChain: "acb"
    },
    customChains: [
      {
        network: "europa",
        chainId: 2046399126,
        urls: {
          apiURL: "https://elated-tan-skat.explorer.mainnet.skalenodes.com/api",
          browserURL: "https://elated-tan-skat.explorer.mainnet.skalenodes.com"
        }
      },
      {
        network: "rubyNewChain",
        chainId: 2255010950618556,
        urls: {
          apiURL: "https://fancy-rasalhague.explorer.staging-v2.skalenodes.com/api",
          browserURL: "https://fancy-rasalhague.explorer.staging-v2.skalenodes.com"
        }
      }
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
