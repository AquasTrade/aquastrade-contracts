import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const FACTORY_ADDRESS = (await ethers.getContract("UniswapV2Factory")).address;
  const RUBY_STAKER_ADDRESS = (await ethers.getContract("RubyStaker")).address;

  let RUBY_TOKEN_ADDRESS = "";

  let ETH_TOKEN_ADDRESS = "";
  if (network.name === "localhost") {
    ETH_TOKEN_ADDRESS = (await ethers.getContract("MockETH")).address;
    RUBY_TOKEN_ADDRESS = (await ethers.getContract("RubyTokenMainnet")).address;
  } else {
    ETH_TOKEN_ADDRESS = <string>process.env.ETHC_TOKEN_ADDRESS;
    RUBY_TOKEN_ADDRESS = (await ethers.getContract("RubyToken")).address;
  }

  const burnPercent = BigNumber.from("20"); // 20 percent

  await deploy("RubyMaker", {
    from: deployer,
    args: [FACTORY_ADDRESS, RUBY_STAKER_ADDRESS, RUBY_TOKEN_ADDRESS, ETH_TOKEN_ADDRESS, burnPercent],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["RubyMaker", "Staking"];
// func.dependencies = ["RubyStaker", "UniswapV2Factory"];

export default func;
