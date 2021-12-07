/* eslint no-use-before-define: "warn" */
import fs from "fs";
import { ethers, network } from "hardhat";

import { UniswapV2Factory, UniswapV2Pair, ERC20 } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const factoryAddr = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;

const debugPairs = async (factory: UniswapV2Factory, deployerAddr: string) => {
  const pair = await factory.allPairs(1);
  console.log("pair", pair);
  const pairLength = (await factory.allPairsLength()).toNumber();

  for (let i = 0; i < pairLength; i++) {
    const pairAddr = await factory.allPairs(i);
    const univ2Pair: UniswapV2Pair = (await ethers.getContractAt("UniswapV2Pair", pairAddr)) as UniswapV2Pair;

    const pairFactory = await univ2Pair.factory();
    const token0addr = await univ2Pair.token0();
    const token1addr = await univ2Pair.token1();
    const reserves = await univ2Pair.getReserves();
    const balance = ethers.utils.formatUnits(await univ2Pair.balanceOf(deployerAddr), 18);
    const token0contract: ERC20 = (await ethers.getContractAt("ERC20", token0addr)) as ERC20; 
    const token1contract: ERC20 = (await ethers.getContractAt("ERC20", token1addr)) as ERC20; 
    

    const token0name = await token0contract.name();
    const token0symbol = await token0contract.symbol();
    const token0decimals = await token0contract.decimals();

    const token1name = await token1contract.name();
    const token1symbol = await token1contract.symbol();
    const token1decimals = await token1contract.decimals();

    const reserve0 = ethers.utils.formatUnits(reserves[0], token0decimals)
    const reserve1 = ethers.utils.formatUnits(reserves[1], token1decimals)


    console.log(`========================================`);
    console.log("Pair debug info:");
    console.log(`Pair addr: ${pairAddr}`);
    console.log(`Factory: ${pairFactory}`);
    console.log(`Token 0: ${token0name} (${token0symbol}) - ${token0addr}`);
    console.log(`Token 1: ${token1name} (${token1symbol}) - ${token1addr}`);
    console.log(`Reserves : [${reserve0}, ${reserve1}]`);
    console.log(`Deployer balance : ${balance}`);
    console.log(`========================================`);
  }
};

const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;

  const blockNumber = await ethers.provider.getBlockNumber();
  const providerNetwork = await ethers.provider.getNetwork();

  console.log("provider network", providerNetwork);
  console.log("deployer network", await deployer.provider?.getNetwork());

  console.log("block number", blockNumber);

  const factoryNetwork = await factory.provider.getNetwork();
  console.log("factory network", factoryNetwork);

  await debugPairs(factory, deployer.address);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
