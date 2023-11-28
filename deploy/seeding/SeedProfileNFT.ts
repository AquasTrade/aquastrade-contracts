import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { get } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const ProfileNFT = await ethers.getContract("ProfileNFT");
  const RubyNFTAdminAddress = (await get("NFTAdmin")).address;

  const tx = await ProfileNFT.setMinter(RubyNFTAdminAddress, true);
  await tx.wait(1);

  const isMinter = await ProfileNFT.minters(RubyNFTAdminAddress);
  console.log(`NFTAdmin set as minter: ${isMinter}`)

  const tx2 = await ProfileNFT.setMinter(deployer, true);
  await tx2.wait(1);

  const isMinter2 = await ProfileNFT.minters(deployer);
  console.log(`deployer ${deployer} set as minter: ${isMinter}`)

  let mtx;
  console.log(`Minting 10 NFTs to treasury ${treasury}`);
  for (let i = 0; i < 10; i++) {
    mtx = await ProfileNFT.mint(treasury);
    await mtx.wait(1);
    console.log('minted #', (await ProfileNFT.nftIds()).toNumber() - 1)
  }

};
export default func;

func.dependencies = ["ProfileNFT", "NFTAdmin"];
func.tags = ["SeedProfileNFT"];
