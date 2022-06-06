import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { PROFILE_NFT_DETAILS, PROFILE_NFT_APPEARANCE } from "../constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyProfileNFT = await getOrNull("RubyProfileNFT");
  const name = "Ruby Profile NFT";
  const symbol = "RPNFT";

  const description = JSON.stringify(PROFILE_NFT_DETAILS);
  const visualAppearance = JSON.stringify(PROFILE_NFT_APPEARANCE);

  if (RubyProfileNFT) {
    log(`reusing "RubyProfileNFT" at ${RubyProfileNFT.address}`);
  } else {
    await deploy("RubyProfileNFT", {
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

func.dependencies = ["RubyProxyAdmin"];
func.tags = ["RubyProfileNFT"];
