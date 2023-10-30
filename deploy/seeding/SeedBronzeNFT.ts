import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const NFT_MINT_AMOUNT = 500;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { get } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const BronzeNFT = await ethers.getContract("BronzeSwapNFT");

  const tx = await BronzeNFT.setMinter(deployer, true);
  await tx.wait(1);

  const isMinter2 = await BronzeNFT.minters(deployer);
  console.log(`deployer ${deployer} set as minter: ${isMinter2}`);

  if (isMinter2 && BronzeNFT) {
    let mtx;
    console.log(`Minting ${NFT_MINT_AMOUNT } NFTs to treasury ${treasury}`);
    for (let i = 0; i < NFT_MINT_AMOUNT ; i++) {
      mtx = await BronzeNFT.mint(treasury);
      await mtx.wait(1);
      console.log("minted #", (await BronzeNFT.nftIds()).toNumber() - 1);
    }
  }
};
export default func;

func.dependencies = ["ProfileNFT", "NFTAdmin"];
func.tags = ["SeedBronzeNFT"];
