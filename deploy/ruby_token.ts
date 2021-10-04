import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("RubyToken", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["RubyToken"];
func.dependencies = ["UniswapV2Factory", "UniswapV2Router02"];

export default func