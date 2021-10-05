import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const ruby = await ethers.getContract("RubyToken");

  const { address } = await deploy("RubyMasterChef", {
    from: deployer,
    args: [
      ruby.address,
      deployer,
      treasury,
      "10000000000000000000", // 10 RUBY per sec
      "1631948400", // Sat Sep 18 09:00
      "100", // 10%
    ],
    log: true,
    deterministicDeployment: false,
  });

  if ((await ruby.owner()) !== address) {
    // Transfer Ruby Ownership to RubyMasterChef
    console.log("Transfer Ruby Ownership to RubyMasterChef");
    await (await ruby.transferOwnership(address)).wait();
  }
};

func.tags = ["RubyMasterChef"];
func.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyToken"];

export default func;
