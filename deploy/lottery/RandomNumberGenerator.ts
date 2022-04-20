import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("RNG_Skale", {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["RandomNumberGenerator", "Lottery"];

export default func;
