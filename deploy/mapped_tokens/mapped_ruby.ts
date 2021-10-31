import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("RubyTokenSkale", {
    from: deployer,
    args: [],
    log: true,
  });


// Setup Roles
// TokenManager
// MasterChef


};

func.tags = ["RubyTokenSkale"];

export default func;
