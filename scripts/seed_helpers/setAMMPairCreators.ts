/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import { UniswapV2Factory, UniswapV2Router02, MockERC20, UniswapV2Pair } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import fs from "fs";

const routerAddr = require(`../../deployments/${network.name}/UniswapV2Router02.json`).address;
const factoryAddr = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;

const main = async () => {
  console.log(network.name);

  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;

  let tx = await factory.setPairCreator(deployer.address);
  await tx.wait(1);

  tx = await factory.setPairCreator(routerAddr);
  await tx.wait(1);

  

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
