import { expect } from "chai";

import { ethers, network } from "hardhat";
import { deployAMM, deployNFTAdmin, deployRubyFreeSwapNFT, deployRubyProfileNFT } from "../utilities/deployment";
describe("UniswapV2Factory", function () {
  beforeEach(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    this.user2 = this.signers[1];


    const rubyProfileNFTDescription = JSON.stringify({
      "randomMetadata": {}
    });

    const rubyFreeSwapNFTDescription = JSON.stringify({
      "description": "swap fees",
      "feeReduction": 1000, 
      "lpFeeDeduction": 3,
      "randomMetadata": {}
    });
  
    const rubyProfileNFTVisualAppearance = JSON.stringify({
      "att1": 1,
      "att2": 2, 
      "att3": 3,
    });


    this.rubyFreeSwapNft = await deployRubyFreeSwapNFT(this.owner.address, "Ruby Free Swap NFT", "RFSNFT", rubyFreeSwapNFTDescription, rubyProfileNFTVisualAppearance)

    this.rubyProfileNft = await deployRubyProfileNFT(this.owner.address, "Ruby Profile NFT", "RPNFT", rubyProfileNFTDescription, rubyProfileNFTVisualAppearance)

    this.nftAdmin = await deployNFTAdmin(this.owner.address, this.rubyProfileNft.address)

    // AMM
    let { factory, ammRouter } = await deployAMM(this.owner.address, this.nftAdmin.address);
    this.factory = factory;
    this.router = ammRouter;
  });

  it("UniswapV2Factory should be deployed correctly", async function () {
    const feeToAddress = await this.factory.feeTo();
    const adminAddress = await this.factory.admin();
    const migratorAddress = await this.factory.migrator();

    expect(feeToAddress).to.be.eq(ethers.constants.AddressZero);
    expect(migratorAddress).to.be.eq(ethers.constants.AddressZero);
    expect(adminAddress).to.be.eq(this.owner.address);
  });

  it("Pair creator should not be set when the sender is not the admin", async function () {
    expect(await this.factory.pairCreators(this.user2.address)).to.be.eq(false);
    await expect(this.factory.connect(this.user2).setPairCreator(this.user2.address)).to.be.revertedWith(
      "UniswapV2: FORBIDDEN",
    );
  });

  it("Pair creator should be set correctly", async function () {
    expect(await this.factory.pairCreators(this.owner.address)).to.be.eq(false);

    await this.factory.setPairCreator(this.owner.address);
    expect(await this.factory.pairCreators(this.owner.address)).to.be.eq(true);

    await this.factory.setPairCreator(this.owner.address);
    expect(await this.factory.pairCreators(this.owner.address)).to.be.eq(false);
  });

  it("New admin should not be set when the sender is not the current admin", async function () {
    expect(await this.factory.admin()).to.be.eq(this.owner.address);
    await expect(this.factory.connect(this.user2).setAdmin(this.user2.address)).to.be.revertedWith(
      "UniswapV2: FORBIDDEN",
    );
  });

  it("New admin should be updated successfully", async function () {
    expect(await this.factory.admin()).to.be.eq(this.owner.address);

    await this.factory.setAdmin(this.user2.address);
    expect(await this.factory.admin()).to.be.eq(this.user2.address);

    await this.factory.connect(this.user2).setPairCreator(this.user2.address);
    expect(await this.factory.pairCreators(this.user2.address)).to.be.eq(true);

    await this.factory.connect(this.user2).setAdmin(this.owner.address);
    expect(await this.factory.admin()).to.be.eq(this.owner.address);
  });

  this.afterEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
