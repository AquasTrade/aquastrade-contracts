import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("RubyTokenMainnet", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
  });

  const tokenContract = await ethers.getContract("RubyTokenMainnet");
  const balanceOf = await tokenContract.balanceOf(deployer);
  console.log("balanceOf", balanceOf.toString());
};

func.tags = ["RubyTokenMainnet"];

export default func;
