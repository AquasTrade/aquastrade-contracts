/* eslint no-use-before-define: "warn" */
import { ethers } from "hardhat";
import { UniswapV2Factory, UniswapV2Pair, RubyMasterChef } from "../typechain";

import ERC20ABI from "../abi/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

export const ETHC_ADDR = "0xD2Aaa00700000000000000000000000000000000";


export const debugChefPools = async (masterChef: RubyMasterChef) => {
    const numPools = (await masterChef.poolLength()).toNumber();
  
    console.log("Num pools: ", numPools);
  
    for (let i = 0; i < numPools; i++) {
      const pool = await masterChef.poolInfo(i);
      console.log(`Pool info ${i}: `, pool);
    }
    const totalAllocPoint = (await masterChef.totalAllocPoint()).toNumber();
    const rubyPerSec = ethers.utils.formatUnits(await masterChef.rubyPerSec());
  
    console.log("Total alloc points ", totalAllocPoint);
    console.log("Ruby per second ", rubyPerSec);
};


export const debugPairs = async (factory: UniswapV2Factory, deployerAddr: string) => {
  const pairLength = (await factory.allPairsLength()).toNumber();

  for (let i = 0; i < pairLength; i++) {
    const pairAddr = await factory.allPairs(i);
    const univ2Pair: UniswapV2Pair = (await ethers.getContractAt("UniswapV2Pair", pairAddr)) as UniswapV2Pair;

    const pairFactory = await univ2Pair.factory();
    const token0Address = await univ2Pair.token0();
    const token1Address = await univ2Pair.token1();

    const [reserves0, reserves1] = await univ2Pair.getReserves();

    const token0 = new ethers.Contract(token0Address, ERC20ABI, ethers.provider);
    const token1 = new ethers.Contract(token1Address, ERC20ABI, ethers.provider);

    console.log(`========================================`);
    console.log("Pair debug info:");
    console.log(`Pair addr: ${pairAddr}`);
    console.log(`Factory: ${pairFactory}`);
    console.log(`Token 0: ${await token0.symbol()}@${token0Address}`);
    console.log(`Token 1: ${await token1.symbol()}@${token1Address}`);
    console.log(`Token0 Reserves : ${ethers.utils.formatUnits(reserves0, await token0.decimals())}`);
    console.log(`Token1 Reserves : ${ethers.utils.formatUnits(reserves1, await token1.decimals())}`);
    console.log(`Deployer balance : ${ethers.utils.formatUnits(await univ2Pair.balanceOf(deployerAddr), await univ2Pair.decimals())}`);
    console.log(`========================================`);
  }
};
