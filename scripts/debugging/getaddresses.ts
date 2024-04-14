import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (hre: HardhatRuntimeEnvironment) => {
  const network = hre.network;
  let accounts = await hre.getNamedAccounts();

  if (network.name === "rubyNewChain" || network.name === "stagingv3") {
    accounts["Faucet"] = require(`../../deployments/${network.name}/Faucet.json`).address;
  } else if (network.name === "europa") {
    accounts["FaucetRubyEuropa"] = require(`../../deployments/${network.name}/FaucetRubyEuropa.json`).address;
  }

  if (network.name === "rubyNewChain" || network.name === "europa" || network.name === "stagingv3") {
    accounts["RubyMasterChef"] = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
    accounts["RubyMaker"] = require(`../../deployments/${network.name}/RubyMaker.json`).address;
    accounts["RubyStaker"] = require(`../../deployments/${network.name}/RubyStaker.json`).address;
    accounts["LotteryBurner"] = require(`../../deployments/${network.name}/LotteryBurner.json`).address;
  }

  console.log(accounts);
};

task("addresses", "Print account addresses").setAction(async (taskArgs, hre) => {
  await main(hre);
});
