/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import { UniswapV2Factory, UniswapV2Router02, MockERC20, UniswapV2Pair } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import fs from "fs";

const rubyAddr = require(`../../deployments/${network.name}/RubyTokenMainnet.json`).address;
const usdcAddr = require(`../../deployments/${network.name}/MockUSDC.json`).address;

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

  rubyPoolAddrs.rubyUsdc = await factory.getPair(rubyAddr, usdcAddr);

  fs.writeFileSync("./utils/ruby_usdc_pool_addr.json", JSON.stringify(rubyPoolAddrs));
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
  // const network = "localhost";
  console.log(network.name);

  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  // // // approve tokens
  await approveTokens([usdcAddr, rubyAddr]);

  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  // // PRICING
  // // 1 RUBY = 50 USD

  const amountRubyUsdcLPruby = ethers.utils.parseUnits("10000", 18);
  const amountRubyUsdcLPusdc = ethers.utils.parseUnits("5000", 6);

  // RUBY-USDC
  console.log("ruby addr", rubyAddr);
  console.log("usdc addr", usdcAddr);
  await addLiquidity(rubyAddr, usdcAddr, amountRubyUsdcLPruby, amountRubyUsdcLPusdc, deployer.address, deadline);

  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;
  const pair = await factory.getPair(rubyAddr, usdcAddr);
  console.log("Factory addr pair", pair);
  await debugPairs(factory, deployer.address);

  // await writeRubyPoolAddrs(factory);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
