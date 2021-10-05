import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const ruby = await ethers.getContract("RubyToken");

  await deploy("RubyMine", {
    from: deployer,
    args: [ruby.address],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["RubyMine"];
func.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyToken"];

export default func;
