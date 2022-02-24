import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const UniswapV2Router = await getOrNull("UniswapV2Router02");
  if (UniswapV2Router) {
    log(`reusing "UniswapV2Router" at ${UniswapV2Router.address}`);
  } else {
    const factoryAddress = (await ethers.getContract("UniswapV2Factory")).address;
    const nftAdminAddress = (await get("RubyNFTAdmin")).address;

    await deploy("UniswapV2Router02", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, factoryAddress, nftAdminAddress],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};

func.dependencies = ["UniswapV2Factory", "RubyNFTAdmin"];
func.tags = ["UniswapV2Router02", "AMM"];

export default func;
