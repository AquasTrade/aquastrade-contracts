import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (hre: HardhatRuntimeEnvironment) => {
  console.log(await hre.getNamedAccounts());
};

task("accounts", "Print account addresses")
  .setAction(async (taskArgs, hre) => {
    await main(hre);
  });
