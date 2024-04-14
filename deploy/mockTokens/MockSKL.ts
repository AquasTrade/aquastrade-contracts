import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("MockSKL", {
    from: deployer,
    log: true,
  });

  const tokenContract = await ethers.getContract("MockSKL");
  const balanceOf = await tokenContract.balanceOf(deployer);
  console.log("balanceOf", ethers.utils.formatUnits(balanceOf, 18));
};

func.tags = ["MockSKL", "MockTokens"];

export default func;
