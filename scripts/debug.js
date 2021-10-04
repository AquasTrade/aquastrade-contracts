/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, tenderly, run } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");
const { getAddresses } = require("../utils/addresses");

const addresses = getAddresses();

const createPair = async (token0, token1) => {
  console.log("Creating pair...");
  const factory = await ethers.getContractAt("UniswapV2Factory", addresses.UniswapV2Factory);
  const res = await factory.createPair(token0, token1).catch(err => {
    console.log("error while creating pair");
  });
  console.log("res", res);
  const recipe = await res.wait(1);
  console.log("recipe", recipe);
};

const addLiquidity = async (tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline) => {
  const router = await ethers.getContractAt("UniswapV2Router02", addresses.UniswapV2Router);
  const res = await router
    .addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline)
    .catch(err => {
      console.log("error while adding liquidity", err);
    });
  console.log("res", res);
  const recipe = await res.wait(1).catch(err => {
    console.log("error while adding liquidity recipe", err);
  });
  console.log("recipe", recipe);
};

const debugPairs = async () => {
  const factory = await ethers.getContractAt("UniswapV2Factory", addresses.UniswapV2Factory);

  const pairLength = await factory.allPairsLength();

  for (let i = 0; i < pairLength; i++) {
    const pairAddr = await factory.allPairs(i);
    const univ2Pair = await ethers.getContractAt("UniswapV2Pair", pairAddr);

    const pairFactory = await univ2Pair.factory();
    const token0 = await univ2Pair.token0();
    const token1 = await univ2Pair.token1();
    const reserves = await univ2Pair.getReserves();
    const balance = await univ2Pair.balanceOf(addresses.deployer);

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

const approveDummyTokens = async tokenAddrs => {
  console.log("Approving tokens...");
  const amount = utils.parseUnits("1000000", 18);

  for (let tokenAddr of tokenAddrs) {
    console.log(`Approving token ${tokenAddr}...`);
    const tokenContract = await ethers.getContractAt("MockERC20", tokenAddr);
    await tokenContract.approve(addresses.UniswapV2Router, amount);
    console.log(`Token ${tokenAddr} approved...`);
  }
};

const main = async () => {
  const fUNI = addresses.fUNI;
  const fDAI = addresses.fDAI;
  await debugPairs();
  // await createPair(fUNI, fDAI);

  await approveDummyTokens([fDAI, fUNI]);

  const blockNumber = await ethers.provider.getBlockNumber();
  console.log("block number", blockNumber);
  const blockData = await ethers.provider.getBlock(blockNumber);
  console.log("block data", blockData);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
  console.log("deadline", deadline.toString());

  await addLiquidity(
    fDAI,
    fUNI,
    utils.parseUnits("100", 18),
    utils.parseUnits("2", 18),
    utils.parseUnits("100", 18),
    utils.parseUnits("2", 18),
    addresses.deployer,
    deadline,
  );

  // abiDecode();
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
