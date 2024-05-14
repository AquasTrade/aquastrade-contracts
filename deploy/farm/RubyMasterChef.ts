import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const RubyMasterChef = await getOrNull("RubyMasterChef");

  let RUBY_TOKEN_ADDRESS = "";

  if (network.name === "localhost") {
    RUBY_TOKEN_ADDRESS = (await get("RubyTokenMainnet")).address;
  } else {
    RUBY_TOKEN_ADDRESS = (await get("RubyToken")).address;
  }

  const RUBY_STAKER_ADDRESS = (await get("RubyStaker")).address;

  const BLOCK_NOW = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
  const RUBY_PER_SECOND = ethers.utils.parseUnits("0.001", 18);

  if (RubyMasterChef) {
    log(`reusing "RubyMasterChef" at ${RubyMasterChef.address}`);
  } else {
    await deploy("RubyMasterChef", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [
            deployer,
            RUBY_TOKEN_ADDRESS,
            RUBY_STAKER_ADDRESS,
            treasury,
            RUBY_PER_SECOND, // RUBY per sec
            BLOCK_NOW.timestamp,
            "100", // 10%
          ],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }

  const rubyMasterChef = await ethers.getContract("RubyMasterChef");
  console.log(
    "Chef creates",
    ethers.utils.formatUnits(await rubyMasterChef.rubyPerSec(), 18),
    "RUBY/s",
    "beginning ts=",
    (await rubyMasterChef.startTimestamp()).toString(),
  );
};

func.dependencies = ["RubyStaker", "RubyProxyAdmin"];
func.tags = ["RubyMasterChef"];

export default func;
