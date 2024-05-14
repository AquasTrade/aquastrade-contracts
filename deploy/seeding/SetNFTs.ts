import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { get } = deployments;
  const { deployer } = await getNamedAccounts();

  const NFTAdmin = await ethers.getContract("NFTAdmin");
  const GoldNFT = await ethers.getContract("GoldSwapNFT");
  const SilverNFT = await ethers.getContract("SilverSwapNFT");
  const BronzeNFT = await ethers.getContract("BronzeSwapNFT");

  let tx = await NFTAdmin.setGoldSwapNFT(GoldNFT.address);
  await tx.wait(1);

  tx = await NFTAdmin.setSilverSwapNFT(SilverNFT.address);
  await tx.wait(1);

  tx = await NFTAdmin.setBronzeSwapNFT(BronzeNFT.address);
  await tx.wait(1);

  const b = await NFTAdmin.bronzeSwapNFT();
  const s = await NFTAdmin.silverSwapNFT();
  const g = await NFTAdmin.goldSwapNFT();

  console.log(`bronsze ${b} | silver  ${s} | gold ${g} `);
};
export default func;

func.dependencies = ["RubyProxyAdmin", "NFTAdmin", "GoldSwapNFT", "SilverSwapNFT", "BronzeSwapNFT"];
func.tags = ["SetNFTs"];
