import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("MockWBTC", {
    from: deployer,
    log: true,
  });

  const tokenContract = await ethers.getContract("MockWBTC");
  const balanceOf = await tokenContract.balanceOf(deployer);
  console.log("balanceOf", ethers.utils.formatUnits(balanceOf, 8));
};

func.tags = ["MockWBTC", "MockTokens"];

export default func;
