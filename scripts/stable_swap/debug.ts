/* eslint no-use-before-define: "warn" */
import fs from "fs";
import { ethers, network } from "hardhat";

import { Swap, LPToken, MockUSDC, MockUSDP, MockUSDT, RubyUSDC, RubyUSDP, RubyUSDT, ERC20 } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { BigNumber } from "ethers";

const rubyUsdPoolAddr = require(`../../deployments/${network.name}/RubyUSDPool.json`).address;
const rubyUsdPoolLpTokenAddr = require(`../../deployments/${network.name}/RubyUSDPoolLPToken.json`).address;

let usdcAddr: any;
let usdpAddr: any;
let usdtAddr: any;

if (network.name === "localhost") {
  usdcAddr = require(`../../deployments/${network.name}/MockUSDC.json`).address;
  usdpAddr = require(`../../deployments/${network.name}/MockUSDP.json`).address;
  usdtAddr = require(`../../deployments/${network.name}/MockUSDT.json`).address;
} else if (network.name === "skaleTestnet") {
  usdcAddr = require(`../../deployments/${network.name}/RubyUSDC.json`).address;
  usdpAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
  usdtAddr = require(`../../deployments/${network.name}/RubyUSDT.json`).address;
}

const addLiquidity = async (pool: Swap, amounts: BigNumber[], minToMint: BigNumber, deadline: BigNumber) => {
  console.log("Adding liquidity to pool...");
  const res = await pool.addLiquidity(amounts, minToMint, deadline);
  const receipt = await res.wait(1);
  console.log("Liquidity to pool added successfully");
};

const trade = () => {};

const removeLiquidity = () => {};

const approveTokens = async (tokens: any[], poolAddr: string, amount: BigNumber) => {
  for (let token of tokens) {
    console.log("Aprooving token...");
    const res = await token.approve(poolAddr, amount);
    await res.wait(1);
  }
  console.log("Tokens approved!");
};

const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  const rubyUsdPool: Swap = (await ethers.getContractAt("Swap", rubyUsdPoolAddr)) as Swap;
  const rubyUsdPoolLpToken: LPToken = (await ethers.getContractAt("LPToken", rubyUsdPoolLpTokenAddr)) as LPToken;

  let usdc;
  let usdp;
  let usdt;

  if (network.name === "localhost") {
    usdc = (await ethers.getContractAt("MockUSDC", usdcAddr)) as MockUSDC;
    usdp = (await ethers.getContractAt("MockUSDP", usdpAddr)) as MockUSDP;
    usdt = (await ethers.getContractAt("MockUSDT", usdtAddr)) as MockUSDT;
  } else if (network.name === "skaleTestnet") {
    usdc = (await ethers.getContractAt("RubyUSDC", usdcAddr)) as RubyUSDC;
    usdp = (await ethers.getContractAt("RubyUSDP", usdpAddr)) as RubyUSDP;
    usdt = (await ethers.getContractAt("RubyUSDT", usdtAddr)) as RubyUSDT;
  }

  await approveTokens([usdc, usdp, usdt], rubyUsdPoolAddr, ethers.constants.MaxUint256);

  const amounts = [
    ethers.utils.parseUnits("100", 18),
    ethers.utils.parseUnits("100", 6),
    ethers.utils.parseUnits("100", 6),
  ];

  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  await addLiquidity(rubyUsdPool, amounts, BigNumber.from(0), deadline);

  let rubyUsdPoolBalanceUSDC = await usdc?.balanceOf(rubyUsdPoolAddr);
  let rubyUsdPoolBalanceUSDP = await usdp?.balanceOf(rubyUsdPoolAddr);
  let rubyUsdPoolBalanceUSDT = await usdt?.balanceOf(rubyUsdPoolAddr);

  let userLpTokenAmount = await rubyUsdPoolLpToken.balanceOf(deployer.address);

  const a = await rubyUsdPool.getA();
  const aPrecise = await rubyUsdPool.getAPrecise();
  const token0 = await rubyUsdPool.getToken(0);
  const token1 = await rubyUsdPool.getToken(1);
  const token2 = await rubyUsdPool.getToken(2);
  const token0balance = await rubyUsdPool.getTokenBalance(0);
  const token1balance = await rubyUsdPool.getTokenBalance(1);
  const token2balance = await rubyUsdPool.getTokenBalance(2);

  console.log("RubyUSDPoolBalanceUSDC", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDC, 6));
  console.log("RubyUSDPoolBalanceUSDP", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDP, 18));
  console.log("RubyUSDPoolBalanceUSDT", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDT, 6));

  console.log("a", a.toString());
  console.log("aPrecise", aPrecise.toString());

  console.log("token0", token0);
  console.log("token1", token1);
  console.log("token2", token2);
  console.log("token0balance", ethers.utils.formatUnits(token0balance, 18));
  console.log("token1balance", ethers.utils.formatUnits(token1balance, 6));
  console.log("token2balance", ethers.utils.formatUnits(token2balance, 6));
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
