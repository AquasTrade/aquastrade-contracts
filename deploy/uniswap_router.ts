import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const wethAddress = (await ethers.getContract("WETH")).address;
  const factoryAddress = (await ethers.getContract("UniswapV2Factory")).address;

  await deploy("UniswapV2Router02", {
    from: deployer,
    args: [factoryAddress, wethAddress],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["UniswapV2Router02", "AMM"];
func.dependencies = ["UniswapV2Factory", "WETH"];

export default func