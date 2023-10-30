import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyNFTAdmin = await getOrNull("NFTAdmin");
  const RubyFreeSwapNFT = await get("GoldSwapNFT");
  const RubyProfileNFT = await get("ProfileNFT");

  if (RubyNFTAdmin) {
    log(`reusing "NFTAdmin" at ${RubyNFTAdmin.address}`);
  } else {
    await deploy("NFTAdmin", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, RubyProfileNFT.address, RubyFreeSwapNFT.address],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["RubyProxyAdmin", "ProfileNFT", "GoldSwapNFT"];
func.tags = ["NFTAdmin"];
