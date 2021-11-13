/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import { UniswapV2Factory, UniswapV2Router02, MockERC20, UniswapV2Pair } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import fs from "fs";

const usdcAddr = require(`../../deployments/${network.name}/RubyUSDC.json`).address;
const usdtAddr = require(`../../deployments/${network.name}/RubyUSDT.json`).address;
const usdpAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
const ethcAddr = "0xD2Aaa00700000000000000000000000000000000";

const routerAddr = require(`../../deployments/${network.name}/UniswapV2Router02.json`).address;
const factoryAddr = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;

const addLiquidity = async (
  tokenA: string,
  tokenB: string,
  amountTokenA: BigNumber,
  amountTokenB: BigNumber,
  to: string,
  deadline: BigNumber,
) => {
  const router: UniswapV2Router02 = (await ethers.getContractAt("UniswapV2Router02", routerAddr)) as UniswapV2Router02;
  const res = await router.addLiquidity(
    tokenA,
    tokenB,
    amountTokenA,
    amountTokenB,
    amountTokenA,
    amountTokenB,
    to,
    deadline,
  );

  const receipt = await res.wait(1);

  if (receipt.status) {
    console.log(`Liquidity added successfully for tokens: ${tokenA}, ${tokenB}`);
  } else {
    console.log(`Could not add liquidity for tokens: ${tokenA}, ${tokenB}`);
  }
};

const addLiquidityETH = async (
  token: string,
  amountToken: BigNumber,
  amountETH: BigNumber,
  to: string,
  deadline: BigNumber,
) => {
  const router: UniswapV2Router02 = (await ethers.getContractAt("UniswapV2Router02", routerAddr)) as UniswapV2Router02;
  const res = await router.addLiquidityETH(token, amountToken, amountToken, amountETH, to, deadline);

  const receipt = await res.wait(1);

  if (receipt.status) {
    console.log(`Liquidity added successfully for token: ${token}, WETH.`);
  } else {
    console.log(`Could not add liquidity for tokens: ${token}, WETH.`);
  }
};

const debugPairs = async (factory: UniswapV2Factory, deployerAddr: string) => {
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

const writeRubyPoolAddrs = async (factory: UniswapV2Factory) => {
  const rubyPoolAddrs: Record<string, string> = {};

  rubyPoolAddrs.usdcUsdt = await factory.getPair(usdcAddr, usdtAddr);
  rubyPoolAddrs.usdcUsdp = await factory.getPair(usdcAddr, usdpAddr);
  rubyPoolAddrs.usdtUsdp = await factory.getPair(usdtAddr, usdpAddr);
  rubyPoolAddrs.usdcEthc = await factory.getPair(usdcAddr, ethcAddr);
  rubyPoolAddrs.usdtEthc = await factory.getPair(usdtAddr, ethcAddr);
  rubyPoolAddrs.usdpEthc = await factory.getPair(usdpAddr, ethcAddr);


  fs.writeFileSync("./utils/new_pools_addr.json", JSON.stringify(rubyPoolAddrs));
};

const approveTokens = async (tokenAddrs: string[]) => {
  console.log("Approving tokens...");
  const amount = ethers.utils.parseUnits("100000000000", 18);

  for (let tokenAddr of tokenAddrs) {
    console.log(`Approving token ${tokenAddr}...`);
    const tokenContract: MockERC20 = (await ethers.getContractAt("MockERC20", tokenAddr)) as MockERC20;
    await tokenContract.approve(routerAddr, amount);
    console.log(`Token ${tokenAddr} approved...`);
  }
};

const main = async () => {
  console.log(network.name);

  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  // // // approve tokens
  await approveTokens([usdpAddr, usdcAddr, usdtAddr, ethcAddr]);

  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  // // PRICING
  // // 1 ETHC = 100,000 USD
  // // 1 ETHC = 100,000 USDC
  // // 1 ETHC = 100,000 USDT
  // // 1 ETHC = 100,000 USDP
  // // 1 USDC = 1 USDT
  // // 1 USDC = 1 USDP
  // // 1 USDT = 1 USDP


  const amountEthC = ethers.utils.parseUnits("2", 18); // 2

  const amountUsdtUsdcEthC = ethers.utils.parseUnits("200000", 6); // 200,000
  const amountUsdpEthC = ethers.utils.parseUnits("200000", 18); // 200,000

  const amountUsdtUsdcStable = ethers.utils.parseUnits("1000000", 6); // 1,000,000
  const amountUsdpStable = ethers.utils.parseUnits("1000000", 18); // 1,000,000

  // USDC-ETHC
  await addLiquidity(usdcAddr, ethcAddr, amountUsdtUsdcEthC, amountEthC, deployer.address, deadline);

  // USDT-ETHC
  await addLiquidity(usdtAddr, ethcAddr, amountUsdtUsdcEthC, amountEthC, deployer.address, deadline);

  // USDP-ETHC
  await addLiquidity(usdpAddr, ethcAddr, amountUsdpEthC, amountEthC, deployer.address, deadline);

  // USDC-USDT
  await addLiquidity(usdcAddr, usdtAddr, amountUsdtUsdcStable, amountUsdtUsdcStable, deployer.address, deadline);

  // USDC-USDP
  await addLiquidity(usdcAddr, usdpAddr, amountUsdtUsdcStable, amountUsdpStable, deployer.address, deadline);

  // USDT-USDP
  await addLiquidity(usdtAddr, usdpAddr, amountUsdtUsdcStable, amountUsdpStable, deployer.address, deadline);

  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;

  await debugPairs(factory, deployer.address);

  await writeRubyPoolAddrs(factory);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
