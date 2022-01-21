/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import { UniswapV2Factory, UniswapV2Router02, MockERC20, UniswapV2Pair } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import fs from "fs";

const usdcAddr = require(`../../deployments/${network.name}/RubyUSDC.json`).address;
const usdtAddr = require(`../../deployments/${network.name}/RubyUSDT.json`).address;
const usdpAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
const daiAddr = require(`../../deployments/${network.name}/RubyDAI.json`).address;
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

  rubyPoolAddrs.usdcUsdt = await factory.getPair(usdcAddr, usdtAddr);
  rubyPoolAddrs.usdcUsdp = await factory.getPair(usdcAddr, usdpAddr);
  rubyPoolAddrs.usdcDai = await factory.getPair(usdcAddr, daiAddr);
  rubyPoolAddrs.usdtUsdp = await factory.getPair(usdtAddr, usdpAddr);
  rubyPoolAddrs.usdtDai = await factory.getPair(usdtAddr, daiAddr);
  rubyPoolAddrs.usdpDai = await factory.getPair(usdpAddr, daiAddr);

  rubyPoolAddrs.usdcRuby = await factory.getPair(usdcAddr, rubyAddr);
  rubyPoolAddrs.usdtRuby = await factory.getPair(usdtAddr, rubyAddr);
  rubyPoolAddrs.usdpRuby = await factory.getPair(usdpAddr, rubyAddr);
  rubyPoolAddrs.daiRuby = await factory.getPair(daiAddr, rubyAddr);

  rubyPoolAddrs.usdtEthc = await factory.getPair(usdtAddr, ethcAddr);
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
  await approveTokens([usdpAddr, usdcAddr, usdtAddr, daiAddr, rubyAddr, ethcAddr]);

  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  // PRICING
  // 1 RUBY = 5 USD
  // 1 RUBY = 5 USDC
  // 1 RUBY = 5 USDT
  // 1 RUBY = 5 USDP
  // 1 RUBY = 5 DAI
  // 1 USDC = 1 USDT
  // 1 USDC = 1 USDP
  // 1 USDC = 1 DAI
  // 1 USDT = 1 USDP
  // 1 USDT = 1 DAI
  // 1 USDP = 1 DAI
  // 1 ETHC = 3000 USDT

  const amountRuby = ethers.utils.parseUnits("2000000", 18); // 2,000,000
  const amountEthc = ethers.utils.parseUnits("1", 18); // 1

  const amountUsdtUsdcRuby = ethers.utils.parseUnits("10000000", 6); // 10,000,000
  const amountUsdtUsdcEthc = ethers.utils.parseUnits("3000", 6); // 3,000
  const amountUsdDaiRuby = ethers.utils.parseUnits("10000000", 18); // 10,000,000

  const amountUsdtUsdcStable = ethers.utils.parseUnits("10000000", 6); // 10,000,000
  const amountUsdpDaiStable = ethers.utils.parseUnits("10000000", 18); // 1,000,000

  // USDC-RUBY
  await addLiquidity(usdcAddr, rubyAddr, amountUsdtUsdcRuby, amountRuby, deployer.address, deadline);

  // USDT-RUBY
  await addLiquidity(usdtAddr, rubyAddr, amountUsdtUsdcRuby, amountRuby, deployer.address, deadline);

  // USDP-RUBY
  await addLiquidity(usdpAddr, rubyAddr, amountUsdDaiRuby, amountRuby, deployer.address, deadline);

  // DAI-RUBY
  await addLiquidity(daiAddr, rubyAddr, amountUsdDaiRuby, amountRuby, deployer.address, deadline);

  // USDC-USDT
  await addLiquidity(usdcAddr, usdtAddr, amountUsdtUsdcStable, amountUsdtUsdcStable, deployer.address, deadline);

  // USDC-USDP
  await addLiquidity(usdcAddr, usdpAddr, amountUsdtUsdcStable, amountUsdpDaiStable, deployer.address, deadline);

  // USDC-DAI
  await addLiquidity(usdcAddr, daiAddr, amountUsdtUsdcStable, amountUsdpDaiStable, deployer.address, deadline);

  // USDT-USDP
  await addLiquidity(usdtAddr, usdpAddr, amountUsdtUsdcStable, amountUsdpDaiStable, deployer.address, deadline);

  // USDT-DAI
  await addLiquidity(usdtAddr, daiAddr, amountUsdtUsdcStable, amountUsdpDaiStable, deployer.address, deadline);

  // USDP-DAI
  await addLiquidity(usdpAddr, daiAddr, amountUsdpDaiStable, amountUsdpDaiStable, deployer.address, deadline);

  // USDT-ETHC
  await addLiquidity(usdtAddr, ethcAddr, amountUsdtUsdcEthc, amountEthc, deployer.address, deadline);

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
