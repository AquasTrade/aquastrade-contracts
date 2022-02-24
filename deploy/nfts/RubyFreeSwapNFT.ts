import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyFreeSwapNFT = await getOrNull("RubyFreeSwapNFT");
  const name = "Ruby Free Swap NFT";
  const symbol = "RFSNFT";

  const description = JSON.stringify({
    "description": "swap fees",
    "feeReduction": 1000, 
    "lpFeeDeduction": 3,
    "randomMetadata": {}
  });

  const visualAppearance = JSON.stringify({
    "att1": 1,
    "att2": 2, 
    "att3": 3,
  });


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

  const rubyFreeSwapNFT = await ethers.getContract("RubyFreeSwapNFT");

  const _description = await rubyFreeSwapNFT.description(); 
  const _visualAppearance = await rubyFreeSwapNFT.visualAppearance(); 

  console.log("description", _description);
  console.log("visual appearance", _visualAppearance);

};
export default func;

func.dependencies = ["RubyProxyAdmin"];
func.tags = ["RubyFreeSwapNFT"];