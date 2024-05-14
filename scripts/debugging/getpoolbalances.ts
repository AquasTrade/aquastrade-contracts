/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { UniswapV2Factory } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

import { debugPairs } from "../utils";

const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];
  const FACTORY_ADDR = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;
  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", FACTORY_ADDR)) as UniswapV2Factory;

  await debugPairs(factory, deployer.address);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
