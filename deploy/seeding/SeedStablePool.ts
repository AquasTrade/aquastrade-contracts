import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { Swap, LPToken, MockUSDC, MockUSDP, MockUSDT, MockDAI, RubyUSDC, RubyUSDP, RubyUSDT, RubyDAI } from "../../typechain";
import { BigNumber } from "ethers";
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";

const addLiquidity = async (pool: Swap, amounts: BigNumber[], minToMint: BigNumber, deadline: BigNumber) => {
  console.log("Adding liquidity to pool...");
  const res = await pool.addLiquidity(amounts, minToMint, deadline);
  // console.log("res", res);
  await res.wait(1);
  console.log("Liquidity to pool added successfully");
};

const approveTokens = async (tokens: any[], poolAddr: string, amount: BigNumber) => {
  for (const token of tokens) {
    console.log("Aprooving token...");
    const res = await token.approve(poolAddr, amount);
    await res.wait(1);
  }
  console.log("Tokens approved!");
};



const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, ethers, network } = hre;
  const { deployer } = await getNamedAccounts();

  const rubyUsdPool: Swap = (await ethers.getContract("RubyUSD4Pool")) as Swap;
  const rubyUsdPoolLpToken: LPToken = (await ethers.getContract("RubyUSD4PoolLPToken")) as LPToken;

  let usdc;
  let usdp;
  let usdt;
  let dai;

  if (network.name === "localhost") {
    usdc = (await ethers.getContract("MockUSDC")) as MockUSDC;
    usdp = (await ethers.getContract("MockUSDP")) as MockUSDP;
    usdt = (await ethers.getContract("MockUSDT")) as MockUSDT;
    dai = (await ethers.getContract("MockDAI")) as MockDAI;
  } else if (network.name === "skaleTestnet" || network.name === "rubyNewChain") {
    usdc = (await ethers.getContract("RubyUSDC")) as RubyUSDC;
    usdp = (await ethers.getContract("RubyUSDP")) as RubyUSDP;
    usdt = (await ethers.getContract("RubyUSDT")) as RubyUSDT;
    dai = (await ethers.getContract("RubyDAI")) as RubyDAI;
  }

  // await approveTokens([usdc, usdp, usdt, dai], rubyUsdPool.address, ethers.constants.MaxUint256);

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

  const deployerUsdcBalance = await usdc?.balanceOf(deployer);
  const deployerUsdpBalance = await usdp?.balanceOf(deployer);
  const deployerDaiBalance = await dai?.balanceOf(deployer);
  const deployerUsdtBalance = await usdt?.balanceOf(deployer);

  console.log("deployerUsdcBalance", ethers.utils.formatUnits(deployerUsdcBalance as BigNumber))
  console.log("deployerUsdpBalance", ethers.utils.formatUnits(deployerUsdpBalance as BigNumber))
  console.log("deployerDaiBalance", ethers.utils.formatUnits(deployerDaiBalance as BigNumber))
  console.log("deployerUsdtBalance", ethers.utils.formatUnits(deployerUsdtBalance as BigNumber))

  await addLiquidity(rubyUsdPool, amounts, BigNumber.from(0), deadline);

  const rubyUsdPoolBalanceUSDC = await usdc?.balanceOf(rubyUsdPool.address);
  const rubyUsdPoolBalanceUSDP = await usdp?.balanceOf(rubyUsdPool.address);
  const rubyUsdPoolBalanceDAI = await dai?.balanceOf(rubyUsdPool.address);
  const rubyUsdPoolBalanceUSDT = await usdt?.balanceOf(rubyUsdPool.address);

  const userLpTokenAmount = await rubyUsdPoolLpToken.balanceOf(deployer);
  console.log("USER LP TOKEN AMOUNT", ethers.utils.formatUnits(userLpTokenAmount, 18));

  console.log("RUBY USD POOL BALANCE USDC", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDC, 6));
  console.log("RUBY USD POOL BALANCE USDT", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDT, 6));
  console.log("RUBY USD POOL BALANCE USDP", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceUSDP, 18));
  console.log("RUBY USD POOL BALANCE DAI", ethers.utils.formatUnits(<BigNumber>rubyUsdPoolBalanceDAI, 18));


};
export default func;

// func.dependencies = ["RubyUSD4Pool", "RubyUSD4PoolLPToken"];
func.tags = ["SeedStablePool"];
