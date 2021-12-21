import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy, execute, get, getOrNull, log, read, save } = deployments;
  const { deployer } = await getNamedAccounts();

  // Manually check if the ruby router is already deployed
  const RubyRouter = await getOrNull("RubyRouter");
  console.log("ruby router", RubyRouter);
  if (RubyRouter) {
    log(`reusing "RubyRouter" at ${RubyRouter.address}`);
  } else {
    const ammRouterAddress = (await get("UniswapV2Router02")).address;
    const stablePoolAddress = (await get("RubyUSD4Pool")).address;
    const maxSwapHops = 3;

    await deploy("RubyRouter", {
      from: deployer,
      log: true,
      skipIfAlreadyDeployed: true,
    });

    await execute(
      "RubyRouter",
      { from: deployer, log: true },
      "initialize",
      ammRouterAddress,
      stablePoolAddress,
      maxSwapHops,
    );
  }
};
export default func;

func.dependencies = ["UniswapV2Router02", "RubyUSD4Pool"];
func.tags = ["RubyRouter"];

