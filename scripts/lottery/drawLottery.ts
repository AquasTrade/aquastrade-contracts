import fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { utils } from "ethers";
import { LotteryFactory, Lottery } from "../../typechain";

interface DrawLotteryArguments {
  lotteryid: number
}

const main = async (taskArgs: DrawLotteryArguments, hre: HardhatRuntimeEnvironment) => {
  const ethers = hre.ethers;
  const network = hre.network;
  const factoryAddr = require(`../../deployments/${network.name}/LotteryFactory.json`).address;
  const factory: LotteryFactory = (await ethers.getContractAt("LotteryFactory", factoryAddr)) as LotteryFactory;

  if (taskArgs.lotteryid == 0) {
    taskArgs.lotteryid = (await factory.getCurrentLottoryId()).toNumber();
  }

  console.log('Drawing lotteryid =', taskArgs.lotteryid);

  try {
    const lotteryAddr = await factory.getLotto(taskArgs.lotteryid);
    const lottery: Lottery = (await ethers.getContractAt("Lottery", lotteryAddr)) as Lottery;

    const isClosed = await lottery.isClosed();
    const isOpened = await lottery.isOpened();
    const isDrawn = await lottery.isDrawn();

    console.log('Lottery isClosed:', isClosed, 'isOpen:', isOpened, 'isDrawn:', isDrawn);

    if (!isOpened && !isClosed)
      throw "'lottery not open'"
    if (!isClosed)
      throw "'lottery still running, not closed'"
    if (isDrawn)
      throw "'lottery is already drawn'"

    const tx = await lottery.drawWinningNumbers();
    await tx.wait();
    console.log('Lottery drawn successfully');
  } catch(err) {
    console.log('Lottery drew failed:', err);
  }
};

// lotteryid = 0 for current active lottery
task("drawLottery", "Draw a Lottery")
  .addParam("lotteryid")
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre);
  });

