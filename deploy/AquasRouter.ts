import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const AquasRouter = await getOrNull("AquasRouter");
  if (AquasRouter) {
    log(`reusing "AquasRouter" at ${AquasRouter.address}`);
  } else {
    const ammRouterAddress = (await get("UniswapV2Router02")).address;

    const stablePoolAddress = "0x45c550dc634bcC271C092A20D36761d3Bb834e5D"; // aqua todo:

    const nftAdminAddress = (await get("NFTAdmin")).address;

    console.log("should be nft admin address ", nftAdminAddress);

    const maxSwapHops = 3;

    await deploy("AquasRouter", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, ammRouterAddress, stablePoolAddress, nftAdminAddress, maxSwapHops],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["UniswapV2Router02", "NFTAdmin"];
func.tags = ["AquasRouter"];
