import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { PROFILE_NFT_DETAILS, PROFILE_NFT_APPEARANCE } from "../constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const ProfileNFT = await getOrNull("ProfileNFT");
  const name = "Profile NFT";
  const symbol = "PNFT";

  const description = JSON.stringify(PROFILE_NFT_DETAILS);
  const visualAppearance = JSON.stringify(PROFILE_NFT_APPEARANCE);

  if (ProfileNFT) {
    log(`reusing "ProfileNFT" at ${ProfileNFT.address}`);
  } else {
    await deploy("ProfileNFT", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, name, symbol, description, visualAppearance],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

//func.dependencies = ["RubyProxyAdmin"];
func.tags = ["ProfileNFT"];
