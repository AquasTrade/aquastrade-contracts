import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;
  const { get } = deployments;

  const RubyNFTAdmin = await ethers.getContract("RubyNFTAdmin");
  const RubyRouter = await get("RubyRouter");

  const tx = await RubyNFTAdmin.setMinter(RubyRouter.address, true);
  await tx.wait(1);

  const isMinter = await RubyNFTAdmin.minters(RubyRouter.address);

  console.log(`RubyRouter set as minter: ${isMinter}`)

};
export default func;

func.dependencies = ["RubyProxyAdmin", "RubyNFTAdmin", "RubyRouter"];
func.tags = ["SeedNFTAdmin"];
