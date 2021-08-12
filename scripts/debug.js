/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, tenderly, run } = require("hardhat");
const { utils, } = require("ethers");
const R = require("ramda");
const {getAddresses} = require('../utils/addresses')

const addresses = getAddresses();

const createPair = async (token0, token1) => {

  const factory = await ethers.getContractAt('UniswapV2Factory', addresses.UniswapV2Factory)
  const res = await factory.createPair(token0, token1).catch(err => {
    console.log("error while creating pair")
  });
  console.log("res", res);
  const recipe = await res.wait(1);
  console.log("recipe", recipe);


}

const abiDecode =  () => {
  const data = "0xe8e337000000000000000000000000004058d058ff62ed347db8a69c43ae9c67268b50b0000000000000000000000000a270484784f043e159f74c03b691f80b6f6e3c240000000000000000000000000000000000000000000000056bc75e2d631000000000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000056bc75e2d631000000000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000005b4442cade5ad6e58fe864b9a58125065d01a74d000000000000000000000000000000000000000000000000000000000003619a"
  const decoded = ethers.utils.defaultAbiCoder.decode(["address","address", "uint", "uint", "uint", "uint", "address", "uint"], data)
  console.log("decoded", decoded);

}

const addLiquidity = async (tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline) => {

  const router = await ethers.getContractAt('UniswapV2Router02', addresses.UniswapV2Router)
  const res = await router.addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline).catch(err => {
    console.log("error while adding liquidity", err);
  });
  console.log("res", res);
  const recipe = await res.wait(1).catch(err => {
    console.log("error while adding liquidity recipe", err);
  });
  console.log("recipe", recipe);


}

const debugPairs = async () => {
  const factory = await ethers.getContractAt('UniswapV2Factory', addresses.UniswapV2Factory)

  const pairLength = await factory.allPairsLength();

  for(let i = 0; i < pairLength; i++) {

    const pairAddr =  await factory.allPairs(i);
    const univ2Pair = await ethers.getContractAt('UniswapV2Pair', pairAddr);

    const pairFactory = await univ2Pair.factory();
    const token0 = await univ2Pair.token0();
    const token1 = await univ2Pair.token1();
    const reserves = await univ2Pair.getReserves();
    const balance = await univ2Pair.balanceOf(addresses.deployer);


    console.log(`========================================`);
    console.log("Pair debug info:")
    console.log(`Pair addr: ${pairAddr}`);
    console.log(`Factory: ${pairFactory}`);
    console.log(`Token 0: ${token0}`);
    console.log(`Token 1: ${token1}`);
    console.log(`Reserves : ${reserves}`);
    console.log(`Deployer balance : ${balance}`);
    console.log(`========================================`);


  }
}


const main = async () => {

    const router = await ethers.getContractAt('UniswapV2Router02', "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")
  const quote = await router.quote(utils.parseEther("5"), utils.parseEther("100"), utils.parseEther("100"));
    console.log("quote", quote.toString());
    console.log("router factory", await router.factory())
    const fUNI = addresses.fUNI;
    const fDAI = addresses.fDAI;
  //
  //   const factory = await ethers.getContractAt('UniswapV2Factory', "0x5FbDB2315678afecb367f032d93F642f64180aa3")
  //   const pair = await factory.getPair(fUNI, fDAI)
  //   console.log("pair", pair)

  await debugPairs();
  // await createPair(fUNI, fDAI);
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log("block number", blockNumber);
  const blockData = await ethers.provider.getBlock(blockNumber);
  console.log("block timestamp", blockData.timestamp);
  const deadline = ethers.BigNumber.from(blockData.timestamp  + 23600);
  console.log("deadline", deadline.toString());
  await addLiquidity(fDAI, fUNI, utils.parseUnits("100", 18), utils.parseUnits("2", 18),utils.parseUnits("100", 18), utils.parseUnits("2", 18), "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",deadline)

  // abiDecode();

};


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
