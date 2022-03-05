const { ethers, network } = require("hardhat");
import { expect } from "chai";
import { utils } from "ethers";

describe("RubyToken", function () {
  before(async function () {
    this.RubyToken = await ethers.getContractFactory("RubyToken");
    this.signers = await ethers.getSigners();
    this.alice = this.signers[0];
    this.bob = this.signers[1];
    this.carol = this.signers[2];
  });

  beforeEach(async function () {
    this.ruby = await this.RubyToken.deploy();
    await this.ruby.deployed();

    const minterRole = await this.ruby.MINTER_ROLE();
    await this.ruby.grantRole(minterRole, this.alice.address);
  });

  it("should have correct name and symbol and decimal", async function () {
    const name = await this.ruby.name();
    const symbol = await this.ruby.symbol();
    const decimals = await this.ruby.decimals();
    expect(name, "RubyToken");
    expect(symbol, "RUBY");
    expect(decimals, "18");
  });

  it("should only allow minter to mint token", async function () {
    await this.ruby.mint(this.alice.address, "100");
    await this.ruby.mint(this.bob.address, "1000");
    await expect(
      this.ruby.connect(this.bob).mint(this.carol.address, "1000", { from: this.bob.address }),
    ).to.be.revertedWith("RUBY::mint: Caller is not a minter");
    const totalSupply = await this.ruby.totalSupply();
    const aliceBal = await this.ruby.balanceOf(this.alice.address);
    const bobBal = await this.ruby.balanceOf(this.bob.address);
    const carolBal = await this.ruby.balanceOf(this.carol.address);
    expect(totalSupply).to.equal("1100");
    expect(aliceBal).to.equal("100");
    expect(bobBal).to.equal("1000");
    expect(carolBal).to.equal("0");
  });

  it("should supply token transfers properly", async function () {
    await this.ruby.mint(this.alice.address, "100");
    await this.ruby.mint(this.bob.address, "1000");
    await this.ruby.transfer(this.carol.address, "10");
    await this.ruby.connect(this.bob).transfer(this.carol.address, "100", {
      from: this.bob.address,
    });
    const totalSupply = await this.ruby.totalSupply();
    const aliceBal = await this.ruby.balanceOf(this.alice.address);
    const bobBal = await this.ruby.balanceOf(this.bob.address);
    const carolBal = await this.ruby.balanceOf(this.carol.address);
    expect(totalSupply, "1100");
    expect(aliceBal, "90");
    expect(bobBal, "900");
    expect(carolBal, "110");
  });

  it("should fail if you try to do bad transfers", async function () {
    await this.ruby.mint(this.alice.address, "100");
    await expect(this.ruby.transfer(this.carol.address, "110")).to.be.revertedWith(
      "ERC20: transfer amount exceeds balance",
    );
    await expect(
      this.ruby.connect(this.bob).transfer(this.carol.address, "1", { from: this.bob.address }),
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("should not exceed max supply of 200m", async function () {
    const maxAmounTokens = 200_000_000;
    const maxAmountWei = utils.parseUnits(maxAmounTokens.toString());

    await expect(this.ruby.mint(this.alice.address, maxAmountWei.add(1))).to.be.revertedWith(
      "RUBY::mint: Cannot exceed max supply.",
    );
    await this.ruby.mint(this.alice.address, maxAmountWei);
  });

  after(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
