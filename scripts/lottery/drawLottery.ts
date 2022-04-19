import fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { utils } from "ethers";
import { LotteryFactory, Lottery } from "../../typechain";

interface DrawLotteryArguments {
  lotteryID: number
}

const main = async (taskArgs: DrawLotteryArguments, hre: HardhatRuntimeEnvironment) => {
  console.log(taskArgs);
  const ethers = hre.ethers;
  const network = hre.network;
  const factoryAddr = require(`../../deployments/${network.name}/LotteryFactory.json`).address;
  const factory: LotteryFactory = (await ethers.getContractAt("LotteryFactory", factoryAddr)) as LotteryFactory;
  if (taskArgs.lotteryID == 0) {
    taskArgs.lotteryID = (await factory.getCurrentLottoryId()).toNumber();
  }
  console.log('lotteryID = ', taskArgs.lotteryID);
  const lotteryAddr = await factory.getLotto(taskArgs.lotteryID);
  const lottery: Lottery = (await ethers.getContractAt("Lottery", lotteryAddr)) as Lottery;
  await lottery.drawWinningNumbers();
  console.log('Lottery drew');
};

// lotteryID = 0 for current active lottery
task("drawLottery", "Draw a Lottery")
  .addPositionalParam("lotteryID")
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre);
  });