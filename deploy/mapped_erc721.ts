import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("SkaleMappedERC721Token", {
    from: deployer,
    args: ["ruby TestERC721", "rubyT721"],
    log: true,
  });

};

func.tags = ["MockERC20s"];

export default func