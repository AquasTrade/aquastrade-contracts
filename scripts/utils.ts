/* eslint no-use-before-define: "warn" */
import { ethers } from "hardhat";
import { BigNumber, FixedNumber } from "ethers";
import { UniswapV2Factory, UniswapV2Pair } from "../typechain";

import ERC20ABI from "../abi/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

export const ETHC_ADDR = "0xD2Aaa00700000000000000000000000000000000";
export const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export type PoolAddressesJSONDict = { [key: string]: string };

type ERC20InfoType = {
  address: string;
  symbol: string;
  decimals: number;
  balance: number;
};

export const getERC20Info = async (erc20Addr: string, balanceAddr: string = ""): Promise<ERC20InfoType> => {
  const ERC20 = new ethers.Contract(erc20Addr, ERC20ABI, ethers.provider);

  const [ERC20name, ERC20decimals, erc20Balance] = await Promise.all([
    ERC20.symbol(),
    ERC20.decimals(),
    ERC20.balanceOf(balanceAddr ? balanceAddr : ZERO_ADDR),
  ]);

  return {
    address: erc20Addr,
    symbol: ERC20name,
    decimals: ERC20decimals,
    balance: erc20Balance,
  };
};

type RewarderInfoType = {
  rewardToken: string;
  lpToken: string;
  tokenPerSec: BigNumber;
};

export type FarmInfoType = {
  id: number;
  lpToken: string;
  allocPoint: BigNumber;
  lastRewardTimestamp: BigNumber;
  accRubyPerShare: BigNumber;
  rewarder: string;
  rewarderInfo: RewarderInfoType | null;
  rewarderTokenInfo: ERC20InfoType | null;
};

type LiquidityPoolInfoType = {
  address: string;
  isSS: boolean;
  token0: ERC20InfoType;
  token1: ERC20InfoType;
  token2: ERC20InfoType | undefined;
  token3: ERC20InfoType | undefined;
  reserves0: BigNumber;
  reserves1: BigNumber;
  reserves2: BigNumber | undefined;
  reserves3: BigNumber | undefined;
  tvl: number | undefined;
  price: number | undefined;
};

export const getUniPairInfo = async (pairAddress: string): Promise<LiquidityPoolInfoType> => {
  const univ2Pair: UniswapV2Pair = (await ethers.getContractAt("UniswapV2Pair", pairAddress)) as UniswapV2Pair;

  const [token0Address, token1Address, reserves] = await Promise.all([
    univ2Pair.token0(),
    univ2Pair.token1(),
    univ2Pair.getReserves(),
  ]);
  const [reserves0, reserves1] = reserves;

  const [token0Info, token1Info] = await Promise.all([getERC20Info(token0Address), getERC20Info(token1Address)]);

  let tvl = 0;
  let price = undefined;

  //console.log(token0Info.symbol, token1Info.symbol, reserves0.toNumber(), reserves1.toNumber(), price)

  if (token0Info.symbol === "USDP") {
    price = FixedNumber.from(reserves0.mul(10000).div(reserves1)).divUnsafe(FixedNumber.from(10000)).toUnsafeFloat();
  } else if (token1Info.symbol === "USDP") {
    price = reserves1.mul(10000).div(reserves0).toNumber() / 10000.0;
  }

  return {
    address: pairAddress,
    isSS: true,
    token0: token0Info,
    token1: token1Info,
    token2: undefined,
    token3: undefined,
    reserves0: reserves0,
    reserves1: reserves1,
    reserves2: undefined,
    reserves3: undefined,
    tvl: undefined,
    price: price ? price : undefined,
  };
};

export const debugPairs = async (factory: UniswapV2Factory, deployerAddr: string = ""): Promise<string[]> => {
  const pairLength = (await factory.allPairsLength()).toNumber();
  console.log("AMM Pairs Length", pairLength);
  let addrs: string[] = [];

  for (let i = 0; i < pairLength; i++) {
    const pairAddr = await factory.allPairs(i);
    const univ2Pair: UniswapV2Pair = (await ethers.getContractAt("UniswapV2Pair", pairAddr)) as UniswapV2Pair;

    addrs.push(pairAddr);

    const pairInfo = await getUniPairInfo(pairAddr);

    // const pairFactory = await univ2Pair.factory();
    // const token0Address = await univ2Pair.token0();
    // const token1Address = await univ2Pair.token1();

    // const [reserves0, reserves1] = await univ2Pair.getReserves();

    // const token0 = new ethers.Contract(token0Address, ERC20ABI, ethers.provider);
    // const token1 = new ethers.Contract(token1Address, ERC20ABI, ethers.provider);

    console.log(`========================================`);
    console.log("AMM Pool debug info:");
    console.log(`Pair addr (LP Token): ${pairAddr}`);
    console.log(`Pool ID: ${i}`);
    // console.log(`Factory: ${pairFactory}`);
    console.log(`Token 0: ${pairInfo.token0.symbol}@${pairInfo.token0.address}`);
    console.log(`Token 1: ${pairInfo.token1.symbol}@${pairInfo.token1.address}`);
    console.log(`Token0 Reserves : ${ethers.utils.formatUnits(pairInfo.reserves0, pairInfo.token0.decimals)}`);
    console.log(`Token1 Reserves : ${ethers.utils.formatUnits(pairInfo.reserves1, pairInfo.token1.decimals)}`);
    console.log(`Price ${pairInfo.price}`);
    if (deployerAddr)
      console.log(
        `Deployer balance : ${ethers.utils.formatUnits(
          await univ2Pair.balanceOf(deployerAddr),
          await univ2Pair.decimals(),
        )}`,
      );
    console.log(`========================================`);
  }

  return addrs;
};
