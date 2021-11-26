import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const RUBY_TOKEN_ADDRESS = "0x0165878a594ca255338adfa4d48449f69242eb8f"; // Ruby token address on the SChain

  const { address } = await deploy("RubyMasterChef", {
    from: deployer,
    args: [
      RUBY_TOKEN_ADDRESS,
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

export default func;
