import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyRouter = await getOrNull("RubyRouter");
  if (RubyRouter) {
    log(`reusing "RubyRouter" at ${RubyRouter.address}`);
  } else {
    const ammRouterAddress = (await get("UniswapV2Router02")).address;
    const stablePoolAddress = (await get("RubyUSD4Pool")).address;
    const nftAdminAddress = (await get("RubyNFTAdmin")).address;
    const maxSwapHops = 3;

    await deploy("RubyRouter", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, ammRouterAddress, stablePoolAddress, nftAdminAddress, maxSwapHops],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["UniswapV2Router02", "RubyUSD4Pool", "RubyNFTAdmin"];
func.tags = ["RubyRouter"];
