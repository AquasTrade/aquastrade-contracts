import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // await deploy("MockUSDP", {
  //   from: deployer,
  //   log: true,
  // });

  let tokenContract = await ethers.getContract("MockUSDP");
  const balanceOf = await tokenContract.balanceOf(deployer);
  console.log("balanceOf", balanceOf.toString());

};

func.tags = ["USDP"];

export default func;
