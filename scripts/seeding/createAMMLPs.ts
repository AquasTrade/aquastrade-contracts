/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import { UniswapV2Factory, UniswapV2Router02, MockERC20, RubyUSDP, RubyToken, RubyWBTC, RubySKL } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import fs from "fs";

import { debugPairs } from "../utils";


const ETHC_ADDR = "0xD2Aaa00700000000000000000000000000000000";

const ROUTER_ADDR = require(`../../deployments/${network.name}/UniswapV2Router02.json`).address;
const FACTORY_ADDR = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;

const addLiquidity = async (
  tokenA: string,
  tokenB: string,
  amountTokenA: BigNumber,
  amountTokenB: BigNumber,
  to: string,
  deadline: BigNumber,
) => {

  const router: UniswapV2Router02 = (await ethers.getContractAt("UniswapV2Router02", ROUTER_ADDR)) as UniswapV2Router02;
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

  //  console.log("res", res)
  const receipt = await res.wait(1);

  if (receipt.status) {
    console.log(`Liquidity added successfully for tokens: ${tokenA}, ${tokenB}`);
  } else {
    console.log(`Could not add liquidity for tokens: ${tokenA}, ${tokenB}`);
  }
};


const approveTokens = async (tokens: any[], routerAddr: string, amount: BigNumber) => {
  for (const token of tokens) {
    const symbol = await token.symbol();
    const decimals = await token.decimals();

    console.log(`Aproving ${routerAddr} to spend ${symbol} token... for ${ethers.utils.formatUnits(amount, decimals)}`);

    const res = await token.approve(routerAddr, amount);
    await res.wait(1);
  }
  console.log("Tokens approved!");
};

const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  if (network.name !== "rubyNewChain") {
    throw new Error("Not Supported (anyway this is dangerous, you chould check the numbers here")
  }

  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", FACTORY_ADDR)) as UniswapV2Factory;
  console.log("Can I create AMM LPs", await factory.pairCreators(deployer.address));

  const ruby = (await ethers.getContract("RubyToken")) as RubyToken;
  const usdp = (await ethers.getContract("RubyUSDP")) as RubyUSDP;
  const wbtc = (await ethers.getContract("RubyWBTC")) as RubyWBTC;
  const skl = (await ethers.getContract("RubySKL")) as RubySKL;

  const ethc = (await ethers.getContractAt("MockERC20", ETHC_ADDR)) as MockERC20;  // works for approve() ABI

  const usdpDecimals = await usdp.decimals();

  // $1 price
  const amountRUBY = ethers.utils.parseUnits("1000", await ruby.decimals()); // 1000
  const amountUSDPRUBY = ethers.utils.parseUnits("1000", usdpDecimals); // 1000

  const amountETHC = ethers.utils.parseUnits("0.02", await ethc.decimals());
  const amountUSDPETHC = ethers.utils.parseUnits("500", usdpDecimals);

  // 30k btc price
  const amountWBTC = ethers.utils.parseUnits("0.5", await wbtc.decimals());
  const amountUSDPWBTC = ethers.utils.parseUnits("15000", usdpDecimals);

  // 0.1 skl price
  const amountSKL = ethers.utils.parseUnits("100000", await skl.decimals());
  const amountUSDPSKL = ethers.utils.parseUnits("10000", usdpDecimals);

  // ATTN: approve tokens, only approve what is needed
  await approveTokens([usdp], ROUTER_ADDR, amountUSDPRUBY.add(amountUSDPETHC).add(amountUSDPWBTC).add(amountUSDPSKL));
  await approveTokens([ruby], ROUTER_ADDR, amountRUBY);
  await approveTokens([ethc], ROUTER_ADDR, amountETHC);
  await approveTokens([wbtc], ROUTER_ADDR, amountWBTC);
  await approveTokens([skl], ROUTER_ADDR, amountSKL);

  let blockNumber;
  let blockData;
  let deadline;

  // USDP-RUBY
  blockNumber = await ethers.provider.getBlockNumber();
  blockData = await ethers.provider.getBlock(blockNumber);
  deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
  await addLiquidity(usdp.address, ruby.address, amountUSDPRUBY, amountRUBY, deployer.address, deadline);

  // USDP-ETH
  blockNumber = await ethers.provider.getBlockNumber();
  blockData = await ethers.provider.getBlock(blockNumber);
  deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
  await addLiquidity(usdp.address, ethc.address, amountUSDPETHC, amountETHC, deployer.address, deadline);

  // USDP-WBTC
  blockNumber = await ethers.provider.getBlockNumber();
  blockData = await ethers.provider.getBlock(blockNumber);
  deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
  await addLiquidity(usdp.address, wbtc.address, amountUSDPWBTC, amountWBTC, deployer.address, deadline);

  // USDP-SKL
  blockNumber = await ethers.provider.getBlockNumber();
  blockData = await ethers.provider.getBlock(blockNumber);
  deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
  await addLiquidity(usdp.address, skl.address, amountUSDPSKL, amountSKL, deployer.address, deadline);

  if (true) {
    const rubyPoolAddrs: Record<string, string> = {};

    rubyPoolAddrs.usdpRUBY = await factory.getPair(usdp.address, ruby.address);
    rubyPoolAddrs.usdpETHC = await factory.getPair(usdp.address, ethc.address);
    rubyPoolAddrs.usdpWBTC = await factory.getPair(usdp.address, wbtc.address);
    rubyPoolAddrs.usdpSKL = await factory.getPair(usdp.address, skl.address);

    fs.writeFileSync(`./deployment_addresses/new_pools_addr.${network.name}.json`, JSON.stringify(rubyPoolAddrs));
  }

  await debugPairs(factory, deployer.address);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
