import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const NFT_MINT_AMOUNT = 50;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { get } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const GoldNFT = await ethers.getContract("GoldSwapNFT");

  const tx = await GoldNFT.setMinter(deployer, true);
  await tx.wait(1);

  const isMinter2 = await GoldNFT.minters(deployer);
  console.log(`deployer ${deployer} set as minter: ${isMinter2}`);

  if (isMinter2 && GoldNFT) {
    let mtx;
    console.log(`Minting ${NFT_MINT_AMOUNT} NFTs to treasury ${treasury}`);
    for (let i = 0; i < NFT_MINT_AMOUNT; i++) {
      mtx = await GoldNFT.mint(treasury);
      await mtx.wait(1);
      console.log("minted #", (await GoldNFT.nftIds()).toNumber() - 1);
    }
  }
};
export default func;

func.dependencies = ["ProfileNFT", "NFTAdmin"];
func.tags = ["SeedGoldNFT"];
