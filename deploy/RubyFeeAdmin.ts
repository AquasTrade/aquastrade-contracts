import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyFreeSwapNFT = await get("RubyFreeSwapNFT");
  const RubyFeeAdmin = await getOrNull("RubyFeeAdmin");

  if (RubyFeeAdmin) {
    log(`reusing "RubyFeeAdmin" at ${RubyFeeAdmin.address}`);
  } else {
    await deploy("RubyFeeAdmin", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, RubyFreeSwapNFT.address],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["RubyProxyAdmin", "RubyFreeSwapNFT"];
func.tags = ["RubyFeeAdmin"];
