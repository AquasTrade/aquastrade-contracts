/* eslint no-use-before-define: "warn" */
import fs from "fs";
import { ethers, network } from "hardhat";
import { utils, BigNumber} from "ethers";

import { UniswapV2Factory, UniswapV2Router02, MockERC20, UniswapV2Pair } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const routerAddr = require(`../deployments/${network.name}/UniswapV2Router02.json`).address;
const factoryAddr = require(`../deployments/${network.name}/UniswapV2Factory.json`).address;

console.log("router addr", routerAddr);

const addLiquidity = async (tokenA: string, tokenB: string, amountA: BigNumber, amountB: BigNumber, to: string, deadline: BigNumber) => {
  const router: UniswapV2Router02 = (await ethers.getContractAt("UniswapV2Router02", routerAddr)) as UniswapV2Router02;
  const res = await router
    .addLiquidity(tokenA, tokenB, amountA, amountB, amountA, amountB, to, deadline)

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


const writePairAddresses = async (factory: UniswapV2Factory, mockTokenAddrs: string[]) => {
  const lpAddresses: string[] = [];

  for(let i = 0 ; i < mockTokenAddrs.length; i+= 2) {
      const pairAddr = await factory.getPair(mockTokenAddrs[i], mockTokenAddrs[i+1]);
      lpAddresses.push(pairAddr);
  }

  fs.writeFileSync("./utils/mock_lp_addrs.json", JSON.stringify(lpAddresses));
}

const approveMockTokens = async (tokenAddrs: string[]) => {
  console.log("Approving tokens...");
  const amount = utils.parseUnits("1000000", 18);

  for (let tokenAddr of tokenAddrs) {
    console.log(`Approving token ${tokenAddr}...`);
    const tokenContract: MockERC20 = (await ethers.getContractAt("MockERC20", tokenAddr)) as MockERC20;
    await tokenContract.approve(routerAddr, amount);
    console.log(`Token ${tokenAddr} approved...`);
  }
};

const main = async () => {

  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  // Mock ERC20s need to be deployed first (yarn deploy --tags MockERC20s)
  const mockTokenAddrs: string[] = JSON.parse(fs.readFileSync("./utils/mock_erc20_addrs.json", {encoding: "utf-8"}));

  await approveMockTokens(mockTokenAddrs);

  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  const amount = utils.parseUnits("500000", 18);


  for (let i = 0; i < mockTokenAddrs.length; i += 2) {
    await addLiquidity(
      mockTokenAddrs[i],
      mockTokenAddrs[i + 1],
      amount,
      amount,
      deployer.address,
      deadline,
    );
  }
  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;

  await debugPairs(factory, deployer.address);
  await writePairAddresses(factory, mockTokenAddrs)
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
