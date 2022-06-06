import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { FREE_SWAP_NFT_DETAILS, FREE_SWAP_NFT_APPEARANCE } from "../constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyFreeSwapNFT = await getOrNull("RubyFreeSwapNFT");
  const name = "Ruby Free Swap NFT";
  const symbol = "RFSNFT";

  const description = JSON.stringify(FREE_SWAP_NFT_DETAILS);
  const visualAppearance = JSON.stringify(FREE_SWAP_NFT_APPEARANCE);

  if (RubyFreeSwapNFT) {
    log(`reusing "RubyFreeSwapNFT" at ${RubyFreeSwapNFT.address}`);
  } else {
    await deploy("RubyFreeSwapNFT", {
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
func.tags = ["RubyFreeSwapNFT"];
