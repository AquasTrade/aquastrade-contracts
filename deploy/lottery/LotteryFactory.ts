import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const LotteryFactory = await getOrNull("LotteryFactory");
  const LotteryBurner = await get("LotteryBurner");

  let RandomNumberGenerator = null;
  if ((network.name === "hardhat") || (network.name === "localhost")) {
    RandomNumberGenerator = await get("RNG_Test");
  } else {
    RandomNumberGenerator = await get("RNG_Skale");
  }

  if (LotteryFactory) {
    log(`reusing "LotteryFactory" at ${LotteryFactory.address}`);
  } else {
    let contract = await deploy("LotteryFactory", {
      from: deployer,
      log: true,
      proxy: {
        owner: deployer,
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [RandomNumberGenerator.address, treasury, LotteryBurner.address],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["RubyProxyAdmin", "RandomNumberGenerator", "LotteryBurner"];
func.tags = ["LotteryFactory", "Lottery"];
