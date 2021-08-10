/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, tenderly, run } = require("hardhat");
const { utils, } = require("ethers");
const R = require("ramda");


const createPair = async (token0, token1) => {

  const factory = await ethers.getContractAt('UniswapV2Factory', "0xFA98329F326cEea8a109203DE7d7f1482EdBA5EF")
  const res = await factory.createPair(token0, token1).catch(err => {
    console.log("error while creating pair")
  });
  console.log("res", res);
  const recipe = await res.wait(1);
  console.log("recipe", recipe);


}


const addLiquidity = async (tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline) => {

  const router = await ethers.getContractAt('UniswapV2Router02', "0xe0E2cb3A5d6f94a5bc2D00FAa3e64460A9D241E1")
  const res = await router.addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline).catch(err => {
    console.log("error while adding liquidity")
  });
  console.log("res", res);
  const recipe = await res.wait(1);
  console.log("recipe", recipe);


}

const debugPairs = async () => {
  const factory = await ethers.getContractAt('UniswapV2Factory', "0xFA98329F326cEea8a109203DE7d7f1482EdBA5EF")

  const pairLength = await factory.allPairsLength();

  for(let i = 0; i < pairLength; i++) {

    const pairAddr =  await factory.allPairs(i);
    const univ2Pair = await ethers.getContractAt('UniswapV2Pair', pairAddr);

    const pairFactory = await univ2Pair.factory();
    const token0 = await univ2Pair.token0();
    const token1 = await univ2Pair.token1();
    const reserves = await univ2Pair.getReserves();


    console.log(`========================================`);
    console.log("Pair debug info:")
    console.log(`Factory: ${pairFactory}`);
    console.log(`Token 0: ${token0}`);
    console.log(`Token 1: ${token1}`);
    console.log(`Reserves : ${reserves}`);
    console.log(`========================================`);


  }
}


const main = async () => {

    const router = await ethers.getContractAt('UniswapV2Router02', "0xe0E2cb3A5d6f94a5bc2D00FAa3e64460A9D241E1")
    console.log("router factory", await router.factory())
    const fUNI = "0xa270484784f043e159f74C03B691F80B6F6e3c24";
    const fDAI = "0x4058d058ff62ED347dB8a69c43Ae9C67268B50b0";

  // await debugPairs();
  // await createPair(fUNI, fDAI);
  const blockNumber = await ethers.provider.getBlockNumber();
  const deadline = ethers.BigNumber.from(blockNumber + 200);
  console.log("deadline", deadline);
  await addLiquidity(fDAI, fUNI, utils.parseUnits("100", 18), utils.parseUnits("2", 18),utils.parseUnits("100", 18), utils.parseUnits("2", 18), "0x5B4442cAdE5aD6e58FE864B9a58125065D01A74d",deadline)

};


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
