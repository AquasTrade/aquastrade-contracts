import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { PROFILE_NFT_DETAILS, PROFILE_NFT_APPEARANCE, FREE_SWAP_NFT_APPEARANCE, FREE_SWAP_NFT_DETAILS, PROFILE_NFT_DETAILS_MAINNET } from "../constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { ethers, network } = hre;

  const rubyFreeSwapNFT = await ethers.getContract("RubyFreeSwapNFT");
  const rubyProfileNft = await ethers.getContract("RubyProfileNFT");

  let tx, description, appearance;

  description = JSON.stringify(FREE_SWAP_NFT_DETAILS);
  appearance = JSON.stringify(FREE_SWAP_NFT_APPEARANCE);
  tx = await rubyFreeSwapNFT.setDescription(description)
  await tx.wait(1);
  tx = await rubyFreeSwapNFT.setVisualAppearance(appearance)
  await tx.wait(1);
  console.log("Set RubyFreeSwapNFT description and appearance");

  if (network.name === "europa") {
    description = JSON.stringify(PROFILE_NFT_DETAILS_MAINNET);
  } else {
    description = JSON.stringify(PROFILE_NFT_DETAILS);
  }
  appearance = JSON.stringify(PROFILE_NFT_APPEARANCE);
  tx = await rubyProfileNft.setDescription(description)
  await tx.wait(1);
  tx = await rubyProfileNft.setVisualAppearance(appearance)
  await tx.wait(1);
  console.log("Set RubyProfileNFT description and appearance");

};
export default func;

func.dependencies = ["RubyFreeSwapNFT", "RubyProfileNFT"];
func.tags = ["SeedNFTAppearance"];
