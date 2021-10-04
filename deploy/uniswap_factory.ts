import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("UniswapV2Factory", {
    from: deployer,
    args: [deployer],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["UniswapV2Factory", "AMM"];

export default func