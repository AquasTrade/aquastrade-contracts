import { expect } from "chai";

import { ethers, network } from "hardhat";
import { deployAMM, deployNftsAndNftAdmin } from "../utilities/deployment";
describe("UniswapV2Factory", function () {
  beforeEach(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    this.user2 = this.signers[1];

    let {rubyFreeSwapNft, rubyProfileNft, nftAdmin} = await deployNftsAndNftAdmin(this.owner.address)

    // AMM
    let { factory, ammRouter } = await deployAMM(this.owner.address, nftAdmin.address);
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
    await expect(this.factory.connect(this.user2).setPairCreator(this.user2.address, true)).to.be.revertedWith(
      "UniswapV2: FORBIDDEN",
    );
  });

  it("Pair creator should be set correctly", async function () {
    expect(await this.factory.pairCreators(this.owner.address)).to.be.eq(false);

    await this.factory.setPairCreator(this.owner.address, true);
    expect(await this.factory.pairCreators(this.owner.address)).to.be.eq(true);

    await this.factory.setPairCreator(this.owner.address, false);
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

    await this.factory.connect(this.user2).setPairCreator(this.user2.address, true);
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
