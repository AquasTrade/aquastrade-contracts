import fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { utils } from "ethers";
import { LotteryFactory, IRubyNFT } from "../../typechain";

interface CreateLotteryArguments {
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
  const network = hre.network;
  console.log(network);
  const factoryAddr = require(`../../deployments/${network.name}/LotteryFactory.json`).address;
  const factory: LotteryFactory = (await ethers.getContractAt("LotteryFactory", factoryAddr)) as LotteryFactory;
  const rubyNFT: IRubyNFT = (await ethers.getContractAt('IRubyNFT', taskArgs.nftAddress)) as IRubyNFT;
  const tx = (await rubyNFT.approve(factoryAddr, taskArgs.nftID));
  await tx.wait(1);
  console.log('NFT token approved');
  const distObj = JSON.parse(taskArgs.distribution);
  await factory.createNewLotto(taskArgs.nftAddress, taskArgs.nftID, taskArgs.size, taskArgs.price, distObj, taskArgs.duration);
  console.log('New Lottery Created');
};

task("createLottery", "Create a new Lottery")
  .addPositionalParam("nftAddress")
  .addPositionalParam("nftID")
  .addPositionalParam("size")
  .addPositionalParam("price")
  .addPositionalParam("distribution")
  .addPositionalParam("duration")
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre);
  });