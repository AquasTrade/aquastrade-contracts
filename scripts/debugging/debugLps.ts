/* eslint no-use-before-define: "warn" */
import fs from "fs";
import { ethers, network } from "hardhat";

import { UniswapV2Factory, UniswapV2Router02, MockERC20, UniswapV2Pair } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";



const routerAddr = require(`../../deployments/${network.name}/UniswapV2Router02.json`).address;
const factoryAddr = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;


const debugPairs = async (factory: UniswapV2Factory, deployerAddr: string) => {
  const pair = (await factory.allPairs(1))
  console.log("pair", pair)
  const pairLength = (await factory.allPairsLength()).toNumber();

  for (let i = 0; i < pairLength; i++) {
    const pairAddr = await factory.allPairs(i);
    const univ2Pair: UniswapV2Pair = (await ethers.getContractAt("UniswapV2Pair", pairAddr)) as UniswapV2Pair;

    const pairFactory = await univ2Pair.factory();
    const token0 = await univ2Pair.token0();
    const token1 = await univ2Pair.token1();
    const reserves = await univ2Pair.getReserves();
    const balance = await univ2Pair.balanceOf(deployerAddr);

    console.log(`========================================`);
    console.log("Pair debug info:");
    console.log(`Pair addr: ${pairAddr}`);
    console.log(`Factory: ${pairFactory}`);
    console.log(`Token 0: ${token0}`);
    console.log(`Token 1: ${token1}`);
    console.log(`Reserves : ${reserves}`);
    console.log(`Deployer balance : ${balance}`);
    console.log(`========================================`);
  }
};

const main = async () => {

  const deployer: SignerWithAddress = (await ethers.getSigners())[0];


const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;
const router: UniswapV2Router02 = (await ethers.getContractAt("UniswapV2Router02", routerAddr)) as UniswapV2Router02;

const weth = await router.WETH();

console.log("weth", weth)

const blockNumber = await ethers.provider.getBlockNumber();
const providerNetwork = await ethers.provider.getNetwork()

console.log("provider network", providerNetwork);
console.log("deployer network", await deployer.provider?.getNetwork());

  console.log("block number", blockNumber);

  const factoryNetwork = await factory.provider.getNetwork()
  console.log("factory network", factoryNetwork);

await debugPairs(factory, deployer.address);
};


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
