import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const FACTORY_ADDRESS = (await ethers.getContract("UniswapV2Factory")).address;
  const ROUTER_ADDRESS = (await ethers.getContract("UniswapV2Router02")).address;
  const USDP_TOKEN_ADDRESS = (await ethers.getContract("RubyUSDP")).address;
  const RUBY_STAKER_ADDRESS = (await ethers.getContract("RubyStaker")).address;

  console.log("init args:", deployer, FACTORY_ADDRESS, ROUTER_ADDRESS, USDP_TOKEN_ADDRESS, RUBY_STAKER_ADDRESS);

  await deploy("DAOPairCreator", {
    from: deployer,
    args: [deployer, FACTORY_ADDRESS, ROUTER_ADDRESS, USDP_TOKEN_ADDRESS, RUBY_STAKER_ADDRESS],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["DAOPairCreator"];

//skale can't depend on stuff once rotated out of current node and no archive node
//func.dependencies = ["RubyStaker", "UniswapV2Factory", "UniswapV2Router", "RubyUSDP"];

export default func;
