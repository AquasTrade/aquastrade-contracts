import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { get } = deployments;
  const { deployer } = await getNamedAccounts();

  const nftAdmin = await ethers.getContract("NFTAdmin");

  const tx = await nftAdmin.setMinter(deployer, true);
  await tx.wait(1);

  const isMinter = await nftAdmin.minters(deployer);

  console.log(`AquasRouter set as minter: ${isMinter}`);
};
export default func;

func.dependencies = ["RubyProxyAdmin", "NFTAdmin"];
func.tags = ["SeedNFTAdmin"];
