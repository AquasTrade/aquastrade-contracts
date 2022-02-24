import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;
  const { get } = deployments;

  const RubyProfileNFT = await ethers.getContract("RubyProfileNFT");
  const RubyNFTAdmin = await get("RubyNFTAdmin");

  let tx = await RubyProfileNFT.setMinter(RubyNFTAdmin.address, true);
  await tx.wait(1);

  const isMinter = await RubyProfileNFT.minters(RubyNFTAdmin.address);

  console.log(`RubyNFTAdmin set as minter: ${isMinter}`)

};
export default func;

func.dependencies = ["RubyProxyAdmin", "RubyProfileNFT", "RubyNFTAdmin"];
func.tags = ["SeedNFTFactory"];
