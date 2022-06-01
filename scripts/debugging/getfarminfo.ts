/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { RubyMasterChef } from "../../typechain";

import { debugChefPools } from "../utils";


const main = async () => {
  const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
  const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", masterChefAddr)) as RubyMasterChef;

  await debugChefPools(masterChef);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
