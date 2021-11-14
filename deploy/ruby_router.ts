import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const wethAddress = (await ethers.getContract("WETH")).address;
  const factoryAddress = (await ethers.getContract("RubyFactory")).address;

  await deploy("RubyRouter", {
    from: deployer,
    args: [factoryAddress, wethAddress],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["RubyRouter", "AMM"];
func.dependencies = ["RubyFactory", "WETH"];

export default func;
