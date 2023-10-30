import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { get } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyNFTAdmin = await ethers.getContract("NFTAdmin");
  

  const tx = await RubyNFTAdmin.setMinter(deployer, true);
  await tx.wait(1);

  const isMinter = await RubyNFTAdmin.minters(deployer);

  console.log(`RubyRouter set as minter: ${isMinter}`)

};
export default func;

func.dependencies = ["RubyProxyAdmin", "NFTAdmin"];
func.tags = ["SeedNFTAdmin"];
