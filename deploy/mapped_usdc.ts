import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("SkaleMappedERC20Token", {
    from: deployer,
    args: ["ruby USDC", "rubyUSDC", ethers.BigNumber.from(6)],
    log: true,
  });
};

func.tags = ["MappedERC20"];

export default func;
