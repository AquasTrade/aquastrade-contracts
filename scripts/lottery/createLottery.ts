import fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { utils } from "ethers";
import { LotteryFactory, MockERC721Token } from "../../typechain";

interface CreateLotteryArguments {
  nftAddress: string,
  nftID: number,
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
  const rubyNFT: MockERC721Token = (await ethers.getContractAt('MockERC721Token', taskArgs.nftAddress)) as MockERC721Token;
  if (taskArgs.mint == "1") {
    console.log('trying to mint');
    let tx = (await rubyNFT.mint(account.address, ""));
    await tx.wait();
    console.log('minted');
    taskArgs.nftID = (await rubyNFT.totalSupply()).toNumber();
  }
  console.log(taskArgs.nftID);
  let tx = (await rubyNFT.approve(factoryAddr, taskArgs.nftID));
  await tx.wait();
  console.log('NFT token approved');
  const distObj = JSON.parse(taskArgs.distribution);
  tx = await factory.createNewLotto(taskArgs.nftAddress, taskArgs.nftID, taskArgs.size, taskArgs.price, distObj, taskArgs.duration);
  tx.wait();
  console.log('New Lottery Created');
};

task("createLottery", "Create a new Lottery")
  .addPositionalParam("nftAddress")
  .addPositionalParam("nftID")
  .addPositionalParam("size")
  .addPositionalParam("price")
  .addPositionalParam("distribution")
  .addPositionalParam("duration")
  .addPositionalParam("mint")
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre);
  });