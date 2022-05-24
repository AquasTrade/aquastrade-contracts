import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyStaker = await getOrNull("RubyStaker");

  let RUBY_TOKEN_ADDRESS = "";

  if (network.name === "localhost") {
    RUBY_TOKEN_ADDRESS = (await ethers.getContract("RubyTokenMainnet")).address;
  } else {
    RUBY_TOKEN_ADDRESS = (await ethers.getContract("RubyToken")).address;
  }

  if (RubyStaker) {
    log(`reusing "RubyStaker" at ${RubyStaker.address}`);
  } else {
    await deploy("RubyStaker", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, RUBY_TOKEN_ADDRESS, 9],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};

func.tags = ["RubyStaker", "Staking"];
func.dependencies = ["RubyProxyAdmin"];

export default func;
