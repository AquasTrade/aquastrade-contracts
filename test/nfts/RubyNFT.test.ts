import { expect } from "chai";

import { ethers, network } from "hardhat";
import { deployRubyNFT } from "../utilities/deployment";
describe("RubyNFT", function () {
  beforeEach(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    this.otherUser = this.signers[1];

    this.name = "Ruby NFT";
    this.symbol = "RNFT";
    this.description = "{}";
    this.visualAppearance = "{}";

    this.rubyNFT = await deployRubyNFT(this.owner.address, this.name, this.symbol, this.description, this.visualAppearance)
  });

  it("RubyNFT should be deployed correctly", async function () {
    const name = await this.rubyNFT.name();
    const symbol = await this.rubyNFT.symbol();
    const description = await this.rubyNFT.description();
    const visualAppearance = await this.rubyNFT.visualAppearance();

    expect(name).to.be.eq(this.name);
    expect(symbol).to.be.eq(this.symbol);
    expect(description).to.be.eq(this.description);
    expect(visualAppearance).to.be.eq(this.visualAppearance);
  });

  it("Minter should be added correctly and minting should be successful", async function () {
  
    await expect(this.rubyNFT.mint(this.owner.address)).to.be.revertedWith("RubyNFT: Minting not allowed");
    expect(await this.rubyNFT.minters(this.owner.address)).to.be.eq(false);
    await expect(this.rubyNFT.setMinter(this.owner.address, true)).to.emit(this.rubyNFT, "MinterSet").withArgs(this.owner.address, true);;
    
    expect(await this.rubyNFT.minters(this.owner.address)).to.be.eq(true);

    expect(await this.rubyNFT.balanceOf(this.owner.address)).to.be.eq(0);
    await expect(this.rubyNFT.mint(this.owner.address)).to.emit(this.rubyNFT, "Transfer").withArgs(ethers.constants.AddressZero, this.owner.address, 0);
    expect(await this.rubyNFT.balanceOf(this.owner.address)).to.be.eq(1);

    await expect(this.rubyNFT.setMinter(this.owner.address, false)).to.emit(this.rubyNFT, "MinterSet").withArgs(this.owner.address, false);
    expect(await this.rubyNFT.minters(this.owner.address)).to.be.eq(false);

  });

  it("Description should be set correctly", async function () {

    const description = JSON.stringify({
        "description": "swap fees",
        "feeReduction": 1000, 
        "lpFeeDeduction": 3,
        "randomMetadata": {}
      });
    
  
    await expect(this.rubyNFT.connect(this.otherUser).setDescription(description)).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(this.rubyNFT.setDescription(description)).to.emit(this.rubyNFT, "DescriptionSet").withArgs(description);

    let description_ = await this.rubyNFT.description(); 

    expect(description_).to.be.eq(description);

  });


  it("Visual appearance should be set correctly", async function () {

    const visualAppearance = JSON.stringify({
        "att1": 1,
        "att2": 2, 
        "att3": 3,
      });

  
    await expect(this.rubyNFT.connect(this.otherUser).setVisualAppearance(visualAppearance)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(this.rubyNFT.setVisualAppearance(visualAppearance)).to.emit(this.rubyNFT, "VisualAppearanceSet").withArgs(visualAppearance);
    const visualAppearance_ = await this.rubyNFT.visualAppearance();
    expect(visualAppearance_).to.be.eq(visualAppearance);

  });


  this.afterEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
