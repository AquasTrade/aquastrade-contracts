import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const factoryAddress = (await ethers.getContract("UniswapV2Factory")).address;

  await deploy("UniswapV2Router02", {
    from: deployer,
    args: [factoryAddress],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["UniswapV2Router02", "AMM"];
func.dependencies = ["UniswapV2Factory"];

export default func;
