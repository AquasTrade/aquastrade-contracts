import { expect } from "chai";

import { ethers, network } from "hardhat";
import { deployNftsAndNftAdmin } from "./utilities/deployment";

describe("NFTAdmin", function () {
  beforeEach(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    this.otherUser = this.signers[1];

    let { rubyFreeSwapNft, rubyProfileNft, nftAdmin } = await deployNftsAndNftAdmin(this.owner.address);

    this.nftAdmin = nftAdmin;
    this.rubyFreeSwapNft = rubyFreeSwapNft;
    this.rubyProfileNft = rubyProfileNft;

    await this.rubyProfileNft.setMinter(this.nftAdmin.address, true);
  });

  it("NFTAdmin should be deployed correctly", async function () {
    const profileNft = await this.nftAdmin.profileNFT();
    const freeSwapNft = await this.nftAdmin.freeSwapNFT();

    expect(profileNft).to.be.eq(this.rubyProfileNft.address);
    expect(freeSwapNft).to.be.eq(this.rubyFreeSwapNft.address);
  });

  it("Minter should be added correctly", async function () {
    await expect(this.nftAdmin.mintProfileNFT(this.owner.address)).to.be.revertedWith("NFTAdmin: Minting not allowed");
    expect(await this.nftAdmin.minters(this.owner.address)).to.be.eq(false);
    await expect(this.nftAdmin.setMinter(this.owner.address, true))
      .to.emit(this.nftAdmin, "MinterSet")
      .withArgs(this.owner.address, true);

    expect(await this.nftAdmin.minters(this.owner.address)).to.be.eq(true);
    await expect(this.nftAdmin.mintProfileNFT(this.owner.address))
      .to.emit(this.rubyProfileNft, "Transfer")
      .withArgs(ethers.constants.AddressZero, this.owner.address, 0);

    await expect(this.nftAdmin.setMinter(this.owner.address, false))
      .to.emit(this.nftAdmin, "MinterSet")
      .withArgs(this.owner.address, false);
    expect(await this.nftAdmin.minters(this.owner.address)).to.be.eq(false);
  });

  it("Profile NFT address should be set correctly", async function () {
    // the same addresses set intentionally
    const newProfileNFTAddress = this.rubyProfileNft.address;

    await expect(this.nftAdmin.connect(this.otherUser).setProfileNFT(newProfileNFTAddress)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );
    await expect(this.nftAdmin.setProfileNFT(newProfileNFTAddress))
      .to.emit(this.nftAdmin, "RubyProfileNFTset")
      .withArgs(newProfileNFTAddress);
    let profileNftAddress = await this.nftAdmin.profileNFT();
    expect(profileNftAddress).to.be.eq(newProfileNFTAddress);
  });

  it("Free Swap NFT address should be set correctly", async function () {
    // the same addresses set intentionally
    const newFreeSwapNFTAddress = this.rubyFreeSwapNft.address;

    await expect(this.nftAdmin.connect(this.otherUser).setFreeSwapNFT(newFreeSwapNFTAddress)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );
    await expect(this.nftAdmin.setFreeSwapNFT(newFreeSwapNFTAddress))
      .to.emit(this.nftAdmin, "FreeSwapNFTSet")
      .withArgs(newFreeSwapNFTAddress);
    let freeSwapNftAddress = await this.nftAdmin.freeSwapNFT();
    expect(freeSwapNftAddress).to.be.eq(newFreeSwapNFTAddress);
  });

  it("ProfileNFT should be minted correctly", async function () {
    await this.nftAdmin.setMinter(this.owner.address, true);

    expect(await this.rubyProfileNft.balanceOf(this.otherUser.address)).to.be.eq(0);
    await expect(this.nftAdmin.mintProfileNFT(this.otherUser.address))
      .to.emit(this.rubyProfileNft, "Transfer")
      .withArgs(ethers.constants.AddressZero, this.otherUser.address, 0);
    expect(await this.rubyProfileNft.balanceOf(this.otherUser.address)).to.be.eq(1);

    // no NFT should be minted this time, as the user already has an NFT
    await this.nftAdmin.mintProfileNFT(this.otherUser.address);
    expect(await this.rubyProfileNft.balanceOf(this.otherUser.address)).to.be.eq(1);

    await expect(
      this.rubyProfileNft.connect(this.otherUser).transferFrom(this.otherUser.address, this.owner.address, 0),
    )
      .to.emit(this.rubyProfileNft, "Transfer")
      .withArgs(this.otherUser.address, this.owner.address, 0);
    expect(await this.rubyProfileNft.balanceOf(this.otherUser.address)).to.be.eq(0);
    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(1);

    // an NFT should be minted to the same user again
    await expect(this.nftAdmin.mintProfileNFT(this.otherUser.address))
      .to.emit(this.rubyProfileNft, "Transfer")
      .withArgs(ethers.constants.AddressZero, this.otherUser.address, 1);
    expect(await this.rubyProfileNft.balanceOf(this.otherUser.address)).to.be.eq(1);
  });

  it("Swap fee deduction should be calculated correctly", async function () {
    expect(await this.rubyFreeSwapNft.balanceOf(this.otherUser.address)).to.be.eq(0);

    expect(await this.nftAdmin.calculateAmmSwapFeeDeduction(this.otherUser.address)).to.be.eq(997);

    await this.rubyFreeSwapNft.setMinter(this.owner.address, true);

    await expect(this.rubyFreeSwapNft.mint(this.otherUser.address))
      .to.emit(this.rubyFreeSwapNft, "Transfer")
      .withArgs(ethers.constants.AddressZero, this.otherUser.address, 0);

    expect(await this.nftAdmin.calculateAmmSwapFeeDeduction(this.otherUser.address)).to.be.eq(1000);
  });

  this.afterEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
