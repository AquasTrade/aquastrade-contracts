const { ethers, network } = require("hardhat");
import { expect } from "chai";

describe("RubyMine", function () {
  before(async function () {
    this.RubyToken = await ethers.getContractFactory("RubyToken");
    this.RubyMine = await ethers.getContractFactory("RubyMine");

    this.signers = await ethers.getSigners();
    this.alice = this.signers[0];
    this.bob = this.signers[1];
    this.carol = this.signers[2];
  });

  beforeEach(async function () {
    this.ruby = await this.RubyToken.deploy();
    this.mine = await this.RubyMine.deploy(this.ruby.address);
    this.ruby.mint(this.alice.address, "100");
    this.ruby.mint(this.bob.address, "100");
    this.ruby.mint(this.carol.address, "100");
  });

  it("should not allow enter if not enough approve", async function () {
    await expect(this.mine.enter("100")).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    await this.ruby.approve(this.mine.address, "50");
    await expect(this.mine.enter("100")).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    await this.ruby.approve(this.mine.address, "100");
    await this.mine.enter("100");
    expect(await this.mine.balanceOf(this.alice.address)).to.equal("100");
  });

  it("should not allow withraw more than what you have", async function () {
    await this.ruby.approve(this.mine.address, "100");
    await this.mine.enter("100");
    await expect(this.mine.leave("200")).to.be.revertedWith("ERC20: burn amount exceeds balance");
  });

  it("should work with more than one participant", async function () {
    await this.ruby.approve(this.mine.address, "100");
    await this.ruby.connect(this.bob).approve(this.mine.address, "100", { from: this.bob.address });
    // Alice enters and gets 20 shares. Bob enters and gets 10 shares.
    await this.mine.enter("20");
    await this.mine.connect(this.bob).enter("10", { from: this.bob.address });
    expect(await this.mine.balanceOf(this.alice.address)).to.equal("20");
    expect(await this.mine.balanceOf(this.bob.address)).to.equal("10");
    expect(await this.ruby.balanceOf(this.mine.address)).to.equal("30");
    // RubyMine get 20 more RUBYs from an external source.
    await this.ruby.connect(this.carol).transfer(this.mine.address, "20", { from: this.carol.address });
    // Alice deposits 10 more RUBYs. She should receive 10*30/50 = 6 shares.
    await this.mine.enter("10");
    expect(await this.mine.balanceOf(this.alice.address)).to.equal("26");
    expect(await this.mine.balanceOf(this.bob.address)).to.equal("10");
    // Bob withdraws 5 shares. He should receive 5*60/36 = 8 shares
    await this.mine.connect(this.bob).leave("5", { from: this.bob.address });
    expect(await this.mine.balanceOf(this.alice.address)).to.equal("26");
    expect(await this.mine.balanceOf(this.bob.address)).to.equal("5");
    expect(await this.ruby.balanceOf(this.mine.address)).to.equal("52");
    expect(await this.ruby.balanceOf(this.alice.address)).to.equal("70");
    expect(await this.ruby.balanceOf(this.bob.address)).to.equal("98");
  });

  after(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
