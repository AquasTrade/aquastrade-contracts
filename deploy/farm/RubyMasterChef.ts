import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  let RUBY_TOKEN_ADDRESS = "";

  if (network.name === "localhost") {
    RUBY_TOKEN_ADDRESS = (await get("RubyTokenMainnet")).address;
  } else {
    RUBY_TOKEN_ADDRESS = (await get("RubyToken")).address;
  }

  const RUBY_STAKER_ADDRESS = (await get("RubyStaker")).address;

  const RUBY_PER_SECOND = ethers.utils.parseUnits("2", 18);

  const { address } = await deploy("RubyMasterChef", {
    from: deployer,
    args: [
      RUBY_TOKEN_ADDRESS,
      RUBY_STAKER_ADDRESS,
      treasury,
      RUBY_PER_SECOND, // 2 RUBY per sec
      "1643122800", // Tue Jan 25 2022 15:00:00 GMT+0000
      "100", // 10%
    ],
    log: true,
    deterministicDeployment: false,
  });
};

func.dependencies = ["RubyStaker"];
func.tags = ["RubyMasterChef"];

export default func;
