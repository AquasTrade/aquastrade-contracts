import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyProfileNFT = await getOrNull("RubyProfileNFT");
  const name = "Ruby Profile NFT";
  const symbol = "RPNFT";

  const description = JSON.stringify({
    "description": "Your unique 3D profile gem on Ruby Exchange",
    "title": "Profile NFT",
    "previewImage": "",
  });

  const visualAppearance = JSON.stringify({
    "type": "profile",
    "seed": "__tokenId",
  });


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

  const rubyProfileNft = await ethers.getContract("RubyProfileNFT");

  const _description = await rubyProfileNft.description(); 
  const _visualAppearance = await rubyProfileNft.visualAppearance(); 

  console.log("description", _description);
  console.log("visual appearance", _visualAppearance);

};
export default func;

func.dependencies = ["RubyProxyAdmin"];
func.tags = ["RubyProfileNFT"];
