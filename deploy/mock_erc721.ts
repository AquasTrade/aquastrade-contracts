
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();


  await deploy("MockERC721Token", {
    from: deployer,
    args: ["TestERC721", "t721"],
    log: true,
  });

};

func.tags = ["Mock721"];

export default func