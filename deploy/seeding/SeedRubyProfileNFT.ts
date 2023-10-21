import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { get } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const RubyProfileNFT = await ethers.getContract("RubyProfileNFT");
  const RubyNFTAdminAddress = (await get("RubyNFTAdmin")).address;

  const tx = await RubyProfileNFT.setMinter(RubyNFTAdminAddress, true);
  await tx.wait(1);

  const isMinter = await RubyProfileNFT.minters(RubyNFTAdminAddress);
  console.log(`RubyNFTAdmin set as minter: ${isMinter}`)

  const tx2 = await RubyProfileNFT.setMinter(deployer, true);
  await tx2.wait(1);

  const isMinter2 = await RubyProfileNFT.minters(deployer);
  console.log(`deployer ${deployer} set as minter: ${isMinter}`)

  let mtx;
  console.log(`Minting 10 NFTs to treasury ${treasury}`);
  for (let i = 0; i < 10; i++) {
    mtx = await RubyProfileNFT.mint(treasury);
    await mtx.wait(1);
    console.log('minted #', (await RubyProfileNFT.nftIds()).toNumber() - 1)
  }

};
export default func;

func.dependencies = ["RubyProfileNFT", "RubyNFTAdmin"];
func.tags = ["SeedRubyProfileNFT"];
