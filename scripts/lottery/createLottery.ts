import fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { utils } from "ethers";
import { LotteryFactory, RubyFreeSwapNFT } from "../../typechain";

interface CreateLotteryArguments {
  nftaddress: string,
  nftid: number,
  size: number,
  price: bigint,
  distribution: string,
  duration: number,
  mint: string,
}

const main = async (taskArgs: CreateLotteryArguments, hre: HardhatRuntimeEnvironment) => {
  const ethers = hre.ethers;
  const network = hre.network;
  const account = (await ethers.getSigners())[0];
  const factoryAddr = require(`../../deployments/${network.name}/LotteryFactory.json`).address;
  const factory: LotteryFactory = (await ethers.getContractAt("LotteryFactory", factoryAddr)) as LotteryFactory;
  const rubyNFT: RubyFreeSwapNFT = (await ethers.getContractAt('RubyFreeSwapNFT', taskArgs.nftaddress)) as RubyFreeSwapNFT;
  if (taskArgs.mint == "1") {
    console.log('Trying to mint');
    let tx = (await rubyNFT.mint(account.address));
    await tx.wait();
    taskArgs.nftid = (await rubyNFT.nftIds()).toNumber() - 1;
    console.log('Minted', taskArgs.nftid);
  }
  console.log('Lottery token ID', taskArgs.nftid);
  let tx = (await rubyNFT.approve(factoryAddr, taskArgs.nftid));
  await tx.wait();
  console.log('NFT token approved');
  const distObj = JSON.parse(taskArgs.distribution);
  tx = await factory.createNewLotto(taskArgs.nftaddress, taskArgs.nftid, taskArgs.size, taskArgs.price, distObj, taskArgs.duration);
  await tx.wait();
  console.log('New Lottery Created');
};

task("createLottery", "Create a new Lottery")
  .addParam("nftaddress")
  .addParam("nftid")
  .addParam("size")
  .addParam("price")
  .addParam("distribution")
  .addParam("duration")
  .addParam("mint")
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre);
  });
