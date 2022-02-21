import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, log, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyFreeSwapNFT = await getOrNull("RubyFreeSwapNFT");
  const name = "Ruby Free Swap NFT";
  const symbol = "RFSNFT";
  const nftFactory = await get("RubyNFTFactory");

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
          args: [deployer, name, symbol, nftFactory.address],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["RubyProxyAdmin", "RubyNFTFactory"];
func.tags = ["RubyFreeSwapNFT"];
