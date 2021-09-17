/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, tenderly, run } = require("hardhat");
const { utils, } = require("ethers");
const R = require("ramda");
const {getAddresses} = require('../utils/addresses')

const addresses = getAddresses();

const addLiquidity = async (tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline) => {

  const router = await ethers.getContractAt('UniswapV2Router02', addresses.UniswapV2Router)
  const res = await router.addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline).catch(err => {
    console.log("error while adding liquidity", err);
  });

  const receipt = await res.wait(1);

  if(receipt.status) {
      console.log(`Liquidity added successfully for tokens: ${tokenA}, ${tokenB}`);
  } else {
    console.log(`Could not add liquidity for tokens: ${tokenA}, ${tokenB}`);
  }


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


const approveDummyTokens = async (tokenAddrs) => {
  console.log("Approving tokens...");
  const amount = utils.parseUnits('1000000', 18)

  for(let tokenAddr of tokenAddrs) {
    console.log(`Approving token ${tokenAddr}...`);
    const tokenContract = await ethers.getContractAt('MockERC20', tokenAddr)
    await tokenContract.approve(addresses.UniswapV2Router, amount);
    console.log(`Token ${tokenAddr} approved...`);
  }

}

const main = async () => {

    const dummyTokens = addresses.dummyTokens;

    // await approveDummyTokens(dummyTokens);

    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp  + 23600);

    const amount = utils.parseUnits("500000", 18);

    for(let i = 0; i < dummyTokens.length; i+=2) {
        await addLiquidity(dummyTokens[i], dummyTokens[i+1], amount, amount, amount, amount, addresses.deployer, deadline)
    }

    await debugPairs();

};


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
