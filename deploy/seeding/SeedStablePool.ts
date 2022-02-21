import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { get } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyNFTFactory = await ethers.getContract("RubyNFTFactory");
  const UniswapV2Router02 = await get("UniswapV2Router02");
  const RubyProfileNFT = await get("RubyProfileNFT");


  const initialNft = await RubyNFTFactory.initialNfts(0);
  if(initialNft === ethers.constants.AddressZero) {
    const tx = await RubyNFTFactory.setInitialNfts(UniswapV2Router02.address, [RubyProfileNFT.address])
    await tx.wait(1);
  }


};
export default func;

func.dependencies = ["RubyProxyAdmin", "RubyNFTFactory", "UniswapV2Router02", "RubyProfileNFT"];
func.tags = ["SeedNFTFactory"];