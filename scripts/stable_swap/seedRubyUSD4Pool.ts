/* eslint no-use-before-define: "warn" */
import fs from "fs";
import { ethers, network } from "hardhat";

import { Swap, LPToken, MockUSDC, MockUSDP, MockUSDT, MockDAI, RubyUSDC, RubyUSDP, RubyUSDT, RubyDAI, ERC20 } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { BigNumber } from "ethers";

const rubyUsdPoolAddr = require(`../../deployments/${network.name}/RubyUSD4Pool.json`).address;
const rubyUsdPoolLpTokenAddr = require(`../../deployments/${network.name}/RubyUSD4PoolLPToken.json`).address;

let usdcAddr: any;
let usdpAddr: any;
let usdtAddr: any;
let daiAddr: any;

if (network.name === "localhost") {
  usdcAddr = require(`../../deployments/${network.name}/MockUSDC.json`).address;
  usdpAddr = require(`../../deployments/${network.name}/MockUSDP.json`).address;
  usdtAddr = require(`../../deployments/${network.name}/MockUSDT.json`).address;
  daiAddr = require(`../../deployments/${network.name}/MockDAI.json`).address;
} else if (network.name === "skaleTestnet") {
  usdcAddr = require(`../../deployments/${network.name}/RubyUSDC.json`).address;
  usdpAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
  usdtAddr = require(`../../deployments/${network.name}/RubyUSDT.json`).address;
  daiAddr = require(`../../deployments/${network.name}/RubyDAI.json`).address;
}

const addLiquidity = async (pool: Swap, amounts: BigNumber[], minToMint: BigNumber, deadline: BigNumber) => {
  console.log("Adding liquidity to pool...");
  const res = await pool.addLiquidity(amounts, minToMint, deadline);
  const receipt = await res.wait(1);
  console.log("Liquidity to pool added successfully");
};

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
  let dai;

  if (network.name === "localhost") {
    usdc = (await ethers.getContractAt("MockUSDC", usdcAddr)) as MockUSDC;
    usdp = (await ethers.getContractAt("MockUSDP", usdpAddr)) as MockUSDP;
    usdt = (await ethers.getContractAt("MockUSDT", usdtAddr)) as MockUSDT;
    dai = (await ethers.getContractAt("MockDAI", daiAddr)) as MockDAI;
  } else if (network.name === "skaleTestnet") {
    usdc = (await ethers.getContractAt("RubyUSDC", usdcAddr)) as RubyUSDC;
    usdp = (await ethers.getContractAt("RubyUSDP", usdpAddr)) as RubyUSDP;
    usdt = (await ethers.getContractAt("RubyUSDT", usdtAddr)) as RubyUSDT;
    dai = (await ethers.getContractAt("RubyDAI", daiAddr)) as RubyDAI;
  }

  await approveTokens([usdc, usdp, usdt, dai], rubyUsdPoolAddr, ethers.constants.MaxUint256);

  // 1 Million of liquidity for each token
  const amounts = [
    ethers.utils.parseUnits("1000000", 18),
    ethers.utils.parseUnits("1000000", 18),
    ethers.utils.parseUnits("1000000", 6),
    ethers.utils.parseUnits("1000000", 6),
  ];

  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  await addLiquidity(rubyUsdPool, amounts, BigNumber.from(0), deadline);

  let rubyUsdPoolBalanceUSDC = await usdc?.balanceOf(rubyUsdPoolAddr);
  let rubyUsdPoolBalanceUSDP = await usdp?.balanceOf(rubyUsdPoolAddr);
  let rubyUsdPoolBalanceDAI = await dai?.balanceOf(rubyUsdPoolAddr);
  let rubyUsdPoolBalanceUSDT = await usdt?.balanceOf(rubyUsdPoolAddr);

  let userLpTokenAmount = await rubyUsdPoolLpToken.balanceOf(deployer.address);
  console.log("USER LP TOKEN AMOUNT", ethers.utils.formatUnits(userLpTokenAmount, 18));

  console.log("RUBY USD POOL BALANCE USDC", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDC, 6));
  console.log("RUBY USD POOL BALANCE USDT", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDT, 6));
  console.log("RUBY USD POOL BALANCE USDP", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDP, 18));
  console.log("RUBY USD POOL BALANCE DAI", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceDAI, 18));
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
