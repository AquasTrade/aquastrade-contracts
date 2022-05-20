import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  let RUBY_TOKEN_ADDRESS = "";

  if (network.name === "localhost") {
    RUBY_TOKEN_ADDRESS = (await ethers.getContract("RubyTokenMainnet")).address;
  } else {
    RUBY_TOKEN_ADDRESS = (await ethers.getContract("RubyToken")).address;
  }

  // deploy with 9 (max num rewards - same value as used in tests)
  await deploy("RubyStaker", {
    from: deployer,
    args: [RUBY_TOKEN_ADDRESS, 9],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["RubyStaker", "Staking"];
func.dependencies = [];

export default func;
