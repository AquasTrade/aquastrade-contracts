/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import { UniswapV2Factory, UniswapV2Router02, MockERC20, UniswapV2Pair } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import fs from "fs";


const usdpAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
const rubyAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
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
    ethers.constants.Zero,
    ethers.constants.Zero,
    to,
    deadline,
  )

    console.log("res", res)

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

  rubyPoolAddrs.usdpRUBY = await factory.getPair(usdpAddr, rubyAddr);
  rubyPoolAddrs.usdpETHC = await factory.getPair(usdpAddr, ethcAddr);

  fs.writeFileSync("./deployment_addresses/new_pools_addr.json", JSON.stringify(rubyPoolAddrs));
};

const approveTokens = async (tokenAddrs: string[]) => {
  console.log("Approving tokens...");
  const amount = ethers.constants.MaxUint256

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

  // approve tokens
  await approveTokens([usdpAddr, rubyAddr, ethcAddr]);

  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  // PRICING
  // 1 ETHC = 10,000,000 RUBY
  // 1 ETHC = 10,000,000 USDP
  // 1 RUBY = 1 USDP

  console.log("rubyAddr", rubyAddr);
  console.log("usdpAddr", usdpAddr);
  console.log("ethcAddr", ethcAddr);



  const amountRUBY = ethers.utils.parseUnits("10000000", 18); // 10,000,000
  const amountETHC = ethers.utils.parseUnits("0.5", 18); // 1

  const amountUSDPRUBY = ethers.utils.parseUnits("10000000", 18); // 10,000,000
  const amountUSDPETHC = ethers.utils.parseUnits("10000000", 18); // 10,000,000


  // USDP-RUBY
  // await addLiquidity(usdpAddr, rubyAddr, amountUSDPRUBY, amountRUBY, deployer.address, deadline);

  // USDP-ETH (TODO)
  await addLiquidity(usdpAddr, ethcAddr, amountUSDPETHC, amountETHC, deployer.address, deadline);

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