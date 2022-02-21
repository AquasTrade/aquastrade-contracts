import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy, execute, get, getOrNull, log, read, save } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyRouter = await getOrNull("RubyRouter");
  if (RubyRouter) {
    log(`reusing "RubyRouter" at ${RubyRouter.address}`);
  } else {
    const ammRouterAddress = (await get("UniswapV2Router02")).address;
    const stablePoolAddress = (await get("RubyUSD4Pool")).address;
    const feeAdminAddress = (await get("RubyFeeAdmin")).address;
    const maxSwapHops = 3;

    await deploy("RubyRouter", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, ammRouterAddress, stablePoolAddress, feeAdminAddress, maxSwapHops],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["UniswapV2Router02", "RubyUSD4Pool", "RubyFeeAdmin"];
func.tags = ["RubyRouter"];