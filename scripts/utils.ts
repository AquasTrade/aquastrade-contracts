/* eslint no-use-before-define: "warn" */
import { ethers } from "hardhat";
import { UniswapV2Factory, UniswapV2Pair } from "../typechain";

import ERC20ABI from "../abi/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";



// const getERC20Balance = async (address: string, symbol: string, hre: HardhatRuntimeEnvironment) => {
//   const ethers = hre.ethers;
//   const network = hre.network;

//   let erc20Addr;
//   if (symbol == 'RUBY') {
//     erc20Addr = require(`../../deployments/${network.name}/RubyToken.json`).address;
//   } else if (symbol == 'ETHC' ) {
//     erc20Addr = '0xD2Aaa00700000000000000000000000000000000';
//   } else {
//     erc20Addr = require(`../../deployments/${network.name}/Ruby${symbol}.json`).address;
//   }

//   const ERC20 = new ethers.Contract(erc20Addr, ERC20Abi, ethers.provider);
//   const ERC20name = await ERC20.symbol();
//   const ERC20decimals = await ERC20.decimals();
//   const erc20Balance = await ERC20.balanceOf(address);


export const ETHC_ADDR = "0xD2Aaa00700000000000000000000000000000000";


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
    console.log(`Pair addr: 0x${pairAddr}`);
    console.log(`Factory: 0x${pairFactory}`);
    console.log(`Token 0: ${await token0.symbol()}@0x${token0Address}`);
    console.log(`Token 1: ${await token1.symbol()}@0x${token1Address}`);
    console.log(`Token0 Reserves : ${ethers.utils.formatUnits(reserves0, await token0.decimals())}`);
    console.log(`Token1 Reserves : ${ethers.utils.formatUnits(reserves1, await token1.decimals())}`);
    console.log(`Deployer balance : ${ethers.utils.formatUnits(await univ2Pair.balanceOf(deployerAddr), await univ2Pair.decimals())}`);
    console.log(`========================================`);
  }
};
