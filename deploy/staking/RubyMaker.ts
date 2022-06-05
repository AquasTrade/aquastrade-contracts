import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyMaker = await getOrNull("RubyMaker");

  const FACTORY_ADDRESS = (await ethers.getContract("UniswapV2Factory")).address;
  const RUBY_STAKER_ADDRESS = (await ethers.getContract("RubyStaker")).address;
  const USDP_TOKEN_ADDRESS = (await ethers.getContract("RubyUSDP")).address;

  let RUBY_TOKEN_ADDRESS = "";

  if (network.name === "localhost") {
    RUBY_TOKEN_ADDRESS = (await ethers.getContract("RubyTokenMainnet")).address;
  } else {
    RUBY_TOKEN_ADDRESS = (await ethers.getContract("RubyToken")).address;
  }

  const burnPercent = BigNumber.from("20"); // 20 percent

  if (RubyMaker) {
    log(`reusing "RubyMaker" at ${RubyMaker.address}`);
  } else {
    await deploy("RubyMaker", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, FACTORY_ADDRESS, RUBY_STAKER_ADDRESS, RUBY_TOKEN_ADDRESS, USDP_TOKEN_ADDRESS, burnPercent],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }

};

func.tags = ["RubyMaker", "Staking"];
func.dependencies = ["RubyStaker", "UniswapV2Factory", "RubyProxyAdmin"];

export default func;
