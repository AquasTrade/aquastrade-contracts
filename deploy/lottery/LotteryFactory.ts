import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const LotteryFactory = await getOrNull("LotteryFactory");
  const RubyToken = await get("RubyToken");
  const RandomNumberGenerator = await get("RandomNumberGenerator");

  if (LotteryFactory) {
    log(`reusing "LotteryFactory" at ${LotteryFactory.address}`);
  } else {
    await deploy("LotteryFactory", {
      from: deployer,
      log: true,
      proxy: {
        // owner: deployer,
        // viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [RubyToken.address, RandomNumberGenerator.address],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["RubyToken", "RandomNumberGenerator"];
func.tags = ["LotteryFactory", "Lottery"];
