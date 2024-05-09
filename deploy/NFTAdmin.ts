import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const nftAdmin = await getOrNull("NFTAdmin");
  const freeSwapNFT = await get("GoldSwapNFT");
  const ProfileNFT = await get("ProfileNFT");

  if (nftAdmin) {
    log(`reusing "NFTAdmin" at ${nftAdmin.address}`);
  } else {
    await deploy("NFTAdmin", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, ProfileNFT.address, freeSwapNFT.address],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["RubyProxyAdmin", "ProfileNFT", "GoldSwapNFT"];
func.tags = ["NFTAdmin"];
