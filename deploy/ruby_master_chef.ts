import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const RUBY_TOKEN_ADDRESS_SCHAIN = ""; // Ruby token address on the SChain

  const { address } = await deploy("RubyMasterChef", {
    from: deployer,
    args: [
      RUBY_TOKEN_ADDRESS_SCHAIN,
      treasury,
      "10000000000000000000", // 10 RUBY per sec
      "1631948400", // Sat Sep 18 09:00
      "100", // 10%
    ],
    log: true,
    deterministicDeployment: false,
  });

};

func.tags = ["RubyMasterChef"];
func.dependencies = ["UniswapV2Factory", "UniswapV2Router02"];

export default func;
