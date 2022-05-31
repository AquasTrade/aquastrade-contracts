import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  if ((network.name === "hardhat") || (network.name === "localhost")) {
    await deploy("RNG_Test", {
      from: deployer,
      args: [],
      log: true,
      deterministicDeployment: false,
    });
  } else {
    await deploy("RNG_Skale", {
      from: deployer,
      args: [],
      log: true,
      deterministicDeployment: false,
    });
  }
};

func.tags = ["RandomNumberGenerator", "Lottery"];

export default func;
