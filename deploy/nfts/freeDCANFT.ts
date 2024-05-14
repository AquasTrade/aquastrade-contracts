import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { FREE_DCA_NFT_DETAILS, FREE_DCA_NFT_APPEARANCE } from "../constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const FreeDCANFT = await getOrNull("FreeDCANFT");
  const name = " Free DCA NFT";
  const symbol = "RFDNFT";

  const description = JSON.stringify(FREE_DCA_NFT_DETAILS);
  const visualAppearance = JSON.stringify(FREE_DCA_NFT_APPEARANCE);

  if (FreeDCANFT) {
    log(`reusing "FreeDCANFT" at ${FreeDCANFT.address}`);
  } else {
    await deploy("FreeDCANFT", {
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
func.tags = ["FreeDCANFT"];
