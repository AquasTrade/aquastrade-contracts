import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const ruby = await ethers.getContract("RubyToken");

  await deploy("RubyBar", {
    from: deployer,
    args: [ruby.address],
    log: true,
    deterministicDeployment: false,
  });

  const bar = await ethers.getContract("RubyBar");
  if ((await bar.owner()) !== deployer) {
    console.log("Setting bar owner");
    await (await bar.transferOwnership(deployer, true, false)).wait();
  }
};

func.tags = ["RubyBar", "Staking"];
func.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyToken"];

export default func;
