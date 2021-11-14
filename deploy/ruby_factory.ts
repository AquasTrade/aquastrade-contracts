import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("RubyFactory", {
    from: deployer,
    args: [deployer],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["RubyFactory", "AMM"];

export default func;
