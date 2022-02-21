import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyProfileNFT = await getOrNull("RubyProfileNFT");
  const name = "Ruby Profile NFT";
  const symbol = "RPNFT";
  const nftFactory = await get("RubyNFTFactory");

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
          args: [deployer, name, symbol, nftFactory],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["RubyProxyAdmin", "RubyNFTFactory"];
func.tags = ["RubyProfileNFT"];
