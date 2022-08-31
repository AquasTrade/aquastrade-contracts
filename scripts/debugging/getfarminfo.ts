/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { RubyMasterChef, UniswapV2Factory } from "../../typechain";

import { debugChefPools } from "../utils";


const main = async () => {
  const CHEF_ADDR = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
  const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", CHEF_ADDR)) as RubyMasterChef;
  const FACTORY_ADDR = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;
  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", FACTORY_ADDR)) as UniswapV2Factory;
  const SS4P_LPADDR = require(`../../deployments/${network.name}/RubyUSD4PoolLPToken.json`).address;

  await debugChefPools(masterChef, factory, SS4P_LPADDR);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
