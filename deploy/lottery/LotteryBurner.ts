import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const LotteryBurner = await getOrNull("LotteryBurner");
  const RubyToken = await get("RubyToken");

  if (LotteryBurner) {
    log(`reusing "LotteryBurner" at ${LotteryBurner.address}`);
  } else {
    await deploy("LotteryBurner", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, RubyToken.address],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }

  // todo - need to grant ruby token burner role to deployed contract

};
export default func;

func.dependencies = ["RubyToken"];
func.tags = ["LotteryBurner", "Lottery"];
