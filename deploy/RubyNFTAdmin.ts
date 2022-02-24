import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyNFTAdmin = await getOrNull("RubyNFTAdmin");
  const RubyProfileNFT = await get("RubyProfileNFT");

  if (RubyNFTAdmin) {
    log(`reusing "RubyNFTAdmin" at ${RubyNFTAdmin.address}`);
  } else {
    await deploy("RubyNFTAdmin", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, RubyProfileNFT.address],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["RubyProxyAdmin", "RubyProfileNFT"];
func.tags = ["RubyFeeAdmin"];
