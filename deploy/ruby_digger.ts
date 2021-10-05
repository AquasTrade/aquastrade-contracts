import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const factory = (await ethers.getContract("UniswapV2Factory")).address;
  const mine = (await ethers.getContract("RubyMine")).address;
  const ruby = (await ethers.getContract("RubyToken")).address;

  let weth = (await ethers.getContract("WETH")).address;

  await deploy("RubyDigger", {
    from: deployer,
    args: [factory, mine, ruby, weth],
    log: true,
    deterministicDeployment: false,
  });

  const maker = await ethers.getContract("RubyDigger");
  if ((await maker.owner()) !== deployer) {
    console.log("Setting maker owner");
    await (await maker.transferOwnership(deployer, true, false)).wait();
  }
};

func.tags = ["RubyDigger"];
func.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyMine", "RubyToken"];

export default func;
