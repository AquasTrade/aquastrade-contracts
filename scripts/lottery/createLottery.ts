import fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { utils } from "ethers";
import { LotteryFactory, IRubyNFT } from "../../typechain";

interface CreateLotteryArguments {
  net: string,
  nftAddress: string,
  nftID: number,
  size: number,
  price: bigint,
  distribution: string,
  duration: number,
}

const main = async (taskArgs: CreateLotteryArguments, hre: HardhatRuntimeEnvironment) => {
  console.log(taskArgs);
  const ethers = hre.ethers;
  const factoryAddr = require(`../../deployments/${taskArgs.net}/LotteryFactory.json`).address;
  const nftABI = require('../../artifacts/contracts/interfaces/IRubyNFT.sol/IRubyNFT.json').abi;
  console.log('factoryAddr', factoryAddr);
  const factory: LotteryFactory = (await ethers.getContractAt("LotteryFactory", factoryAddr)) as LotteryFactory;
  console.log('factory');
  console.log(factory);
  console.log('factory end');
  const rubyFactory = ethers.getContractFactory('RubyNFT');
  console.log(rubyFactory);
  const rubyNFT: IRubyNFT = (await ethers.getContractAt(nftABI, taskArgs.nftAddress)) as IRubyNFT;
  console.log('rubyNFT');
  console.log(rubyNFT);
  await rubyNFT.approve(factoryAddr, taskArgs.nftID);
  const distObj = JSON.parse(taskArgs.distribution);
  console.log(distObj);
  await factory.createNewLotto(taskArgs.nftAddress, taskArgs.nftID, taskArgs.size, taskArgs.price, distObj, taskArgs.duration);
};

task("createLottery", "Create a new Lottery")
  .addPositionalParam("net")
  .addPositionalParam("nftAddress")
  .addPositionalParam("nftID")
  .addPositionalParam("size")
  .addPositionalParam("price")
  .addPositionalParam("distribution")
  .addPositionalParam("duration")
  .setAction(async (taskArgs, hre) => {
    main(taskArgs, hre);
  });