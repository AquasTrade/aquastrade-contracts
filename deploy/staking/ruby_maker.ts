import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const factory = (await ethers.getContract("RubyFactory")).address;
  const bar = (await ethers.getContract("RubyBar")).address;
  const ruby = (await ethers.getContract("RubyToken")).address;

  let weth = (await ethers.getContract("WETH")).address;

  let burnPercent = BigNumber.from("20"); // 20 percent

  await deploy("RubyMaker", {
    from: deployer,
    args: [factory, bar, ruby, weth, burnPercent],
    log: true,
    deterministicDeployment: false,
  });

  const maker = await ethers.getContract("RubyMaker");
  if ((await maker.owner()) !== deployer) {
    console.log("Setting maker owner");
    await (await maker.transferOwnership(deployer, true, false)).wait();
  }
};

func.tags = ["RubyMaker", "Staking"];
func.dependencies = ["RubyBar", "RubyToken"];

export default func;
