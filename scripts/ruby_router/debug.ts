/* eslint no-use-before-define: "warn" */
import fs from "fs";
import { ethers, network } from "hardhat";

import {
  Swap,
  LPToken,
  MockUSDC,
  MockUSDP,
  MockUSDT,
  RubyUSDC,
  RubyUSDP,
  RubyUSDT,
  ERC20,
  RubyRouter,
  RubyTokenMainnet,
  RubyToken,
  UniswapV2Router02,
  IUniswapV2Pair,
} from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { BigNumber } from "ethers";

const rubyUsdPoolAddr = require(`../../deployments/${network.name}/RubyUSDPool.json`).address;
const rubyRouterAddr = require(`../../deployments/${network.name}/RubyRouter.json`).address;
const ammRouterAddr = require(`../../deployments/${network.name}/UniswapV2Router02.json`).address;
const rubyUsdPoolLpTokenAddr = require(`../../deployments/${network.name}/RubyUSDPoolLPToken.json`).address;
const rubyUsdcAmmLpAddr = "0x8D5C1A588DA7C2aCD649F5826f085552A589200b";

enum SwapType {
  AMM,
  STABLE_POOL,
}

enum AMMSwapType {
  EXACT_TOKENS_FOR_TOKENS,
  TOKENS_FOR_EXACT_TOKENS,
}

let usdcAddr: any;
let usdpAddr: any;
let usdtAddr: any;
let rubyAddr: any;

if (network.name === "localhost") {
  usdcAddr = require(`../../deployments/${network.name}/MockUSDC.json`).address;
  usdpAddr = require(`../../deployments/${network.name}/MockUSDP.json`).address;
  usdtAddr = require(`../../deployments/${network.name}/MockUSDT.json`).address;
  rubyAddr = require(`../../deployments/${network.name}/RubyTokenMainnet.json`).address;
} else if (network.name === "skaleTestnet") {
  usdcAddr = require(`../../deployments/${network.name}/RubyUSDC.json`).address;
  usdpAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
  usdtAddr = require(`../../deployments/${network.name}/RubyUSDT.json`).address;
  rubyAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
}

const trade = () => {};

const removeLiquidity = () => {};

const approveTokens = async (tokens: any[], spenderAddr: string, amount: BigNumber) => {
  for (let token of tokens) {
    console.log("Aprooving token...");
    const res = await token.approve(spenderAddr, amount);
    await res.wait(1);
  }
  console.log("Tokens approved!");
};

const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  const rubyRouter: RubyRouter = (await ethers.getContractAt("RubyRouter", rubyRouterAddr)) as RubyRouter;
  const rubyUsdPool: Swap = (await ethers.getContractAt("Swap", rubyUsdPoolAddr)) as Swap;
  const ammRouter: UniswapV2Router02 = (await ethers.getContractAt(
    "UniswapV2Router02",
    ammRouterAddr,
  )) as UniswapV2Router02;
  const rubyUsdPoolLpToken: LPToken = (await ethers.getContractAt("LPToken", rubyUsdPoolLpTokenAddr)) as LPToken;

  let usdc;
  let usdp;
  let usdt;
  let ruby;

  if (network.name === "localhost") {
    usdc = (await ethers.getContractAt("MockUSDC", usdcAddr)) as MockUSDC;
    usdp = (await ethers.getContractAt("MockUSDP", usdpAddr)) as MockUSDP;
    usdt = (await ethers.getContractAt("MockUSDT", usdtAddr)) as MockUSDT;
    ruby = (await ethers.getContractAt("RubyTokenMainnet", rubyAddr)) as RubyTokenMainnet;
  } else if (network.name === "skaleTestnet") {
    usdc = (await ethers.getContractAt("RubyUSDC", usdcAddr)) as RubyUSDC;
    usdp = (await ethers.getContractAt("RubyUSDP", usdpAddr)) as RubyUSDP;
    usdt = (await ethers.getContractAt("RubyUSDT", usdtAddr)) as RubyUSDT;
    ruby = (await ethers.getContractAt("RubyToken", rubyAddr)) as RubyToken;
  }

  await approveTokens([usdc, usdp, usdt, ruby], rubyRouterAddr, ethers.constants.MaxUint256);

  // We have 2 pools:
  // 1 RUBY = 5 USDC, RUBY/USDC Uniswap V2 liquidity pool
  // Stable pool where USDP = USDC = USDT
  // The user want to trade RUBY <-> USDP

  const rubyAmount = ethers.utils.parseUnits("1000", 18);
  const usdcAmount = ethers.utils.parseUnits("5000", 6);
  const usdpAmount = ethers.utils.parseUnits("5000", 6);

  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  const amountsOut = await ammRouter.getAmountsOut(rubyAmount, [rubyAddr, usdcAddr]);
  const usdcAmountIn = amountsOut[1];

  const usdcTokenIndex = await rubyUsdPool.getTokenIndex(usdcAddr);
  const usdpTokenIndex = await rubyUsdPool.getTokenIndex(usdpAddr);
  const usdpAmountOut = await rubyUsdPool.calculateSwap(usdcTokenIndex, usdpTokenIndex, usdcAmountIn);

  const swapDetails = {
    ammSwaps: [{
        swapType: AMMSwapType.EXACT_TOKENS_FOR_TOKENS,
        amountIn: rubyAmount,
        amountOut: usdcAmountIn,
        path: [rubyAddr, usdcAddr],
        to: rubyRouterAddr,
        deadline: deadline
    }
    ],
    stableSwaps: [{
        stablePool: rubyUsdPoolAddr,
        tokenIndexFrom: usdcTokenIndex,
        tokenIndexTo: usdpTokenIndex,
        dx: usdcAmountIn,
        minDy: usdpAmountOut,
        deadline: deadline
    }],
    order: [SwapType.AMM, SwapType.STABLE_POOL]
  };

  // await rubyRouter.swap(swapDetails);

  let rubyRouterlUsdpAmount = await usdp?.balanceOf(rubyRouter.address);
  let rubyRouterUsdcAmount = await usdc?.balanceOf(rubyRouter.address);
  let rubyRouterRubyAmount = await ruby?.balanceOf(rubyRouter.address);

  console.log("rubyRouterlUsdpAmount", ethers.utils.formatUnits(<BigNumber>rubyRouterlUsdpAmount, 18));
  console.log("rubyRouterUsdcAmount", ethers.utils.formatUnits(<BigNumber>rubyRouterUsdcAmount, 6));
  console.log("rubyRouterRubyAmount", ethers.utils.formatUnits(<BigNumber>rubyRouterRubyAmount, 18));

  let rubyUsdPoolBalanceUSDC = await usdc?.balanceOf(rubyUsdPoolAddr);
  let rubyUsdPoolBalanceUSDP = await usdp?.balanceOf(rubyUsdPoolAddr);
  let rubyUsdPoolBalanceUSDT = await usdt?.balanceOf(rubyUsdPoolAddr);

  console.log("rubyUsdPoolBalanceUSDC", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDC, 6));
  console.log("rubyUsdPoolBalanceUSDP", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDP, 18));
  console.log("rubyUsdPoolBalanceUSDT", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDT, 6));

  let rubyUsdcAmmBalanceUSDC = await usdc?.balanceOf(rubyUsdcAmmLpAddr);
  let rubyUsdcAmmBalanceRUBY = await ruby?.balanceOf(rubyUsdcAmmLpAddr);

  console.log("rubyUsdcAmmBalanceUSDC", ethers.utils.formatUnits(<BigNumber>rubyUsdcAmmBalanceUSDC, 6));
  console.log("rubyUsdcAmmBalanceRUBY", ethers.utils.formatUnits(<BigNumber>rubyUsdcAmmBalanceRUBY, 18));
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
