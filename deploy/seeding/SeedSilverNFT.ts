import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const NFT_MINT_AMOUNT = 500;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { get } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const SilverNFT = await ethers.getContract("SilverSwapNFT");

  const tx = await SilverNFT.setMinter(deployer, true);
  await tx.wait(1);

  const isMinter2 = await SilverNFT.minters(deployer);
  console.log(`deployer ${deployer} set as minter: ${isMinter2}`);

  if (isMinter2 && SilverNFT) {
    let mtx;
    console.log(`Minting ${NFT_MINT_AMOUNT } NFTs to treasury ${treasury}`);
    for (let i = 0; i < NFT_MINT_AMOUNT ; i++) {
      mtx = await SilverNFT.mint(treasury);
      await mtx.wait(1);
      console.log("minted #", (await SilverNFT.nftIds()).toNumber() - 1);
    }
  }
};
export default func;

func.dependencies = ["ProfileNFT", "NFTAdmin"];
func.tags = ["SeedSilverNFT"];
