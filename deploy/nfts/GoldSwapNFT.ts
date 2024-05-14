import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { FREE_SWAP_NFT_DETAILS, FREE_SWAP_NFT_APPEARANCE } from "../constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const freeSwapNFT = await getOrNull("GoldSwapNFT");
  const name = "Gold Swap NFT";
  const symbol = "GSNFT";

  const description = JSON.stringify(FREE_SWAP_NFT_DETAILS);
  const visualAppearance = JSON.stringify(FREE_SWAP_NFT_APPEARANCE);

  if (freeSwapNFT) {
    log(`reusing "GoldSwapNFT" at ${freeSwapNFT.address}`);
  } else {
    await deploy("GoldSwapNFT", {
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
func.tags = ["GoldSwapNFT"];
