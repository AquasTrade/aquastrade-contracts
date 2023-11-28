/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { UniswapV2Factory } from "../../typechain";

import { debugPairs } from "../utils";

const main = async () => {
  const FACTORY_ADDR = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;
  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", FACTORY_ADDR)) as UniswapV2Factory;
  const pairAddrs = await debugPairs(factory);
  console.log(`=AMM POOLS / PAIRS==================================\n`, pairAddrs, FACTORY_ADDR);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
