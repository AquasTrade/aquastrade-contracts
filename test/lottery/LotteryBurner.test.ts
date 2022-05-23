const { ethers, upgrades } = require("hardhat");
import { expect } from "chai";
import exp from "constants";

const { lotto } = require("./settings.ts");

describe("LotteryBurner", function () {
  before(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    this.other = this.signers[1];

    this.RubyToken = await ethers.getContractFactory("RubyTokenMintable");
    this.LotteryBurner = await ethers.getContractFactory("LotteryBurner");
  });

  beforeEach(async function () {
    // deploys the ruby token and sends funds to the deployer
    this.ruby = await this.RubyToken.deploy();
    await this.ruby.deployed();

    this.burner = await upgrades.deployProxy(this.LotteryBurner, [this.owner.address, this.ruby.address]);
    await this.burner.deployed();

    this.burnerRole = await this.ruby.BURNER_ROLE();
  });

  it("should be deployed correctly", async function () {
    expect(await this.burner.burned()).to.be.eq(0);
  });

  it("grant burner role", async function () {
    expect(await this.ruby.hasRole(this.burnerRole, this.burner.address)).to.be.eq(false);
    await expect(this.ruby.connect(this.other).grantRole(this.burnerRole, this.burner.address)).to.be.revertedWith("AccessControl: sender must be an admin to grant");

    await this.ruby.connect(this.owner).grantRole(this.burnerRole, this.burner.address);
    expect(await this.ruby.hasRole(this.burnerRole, this.burner.address)).to.be.eq(true);
  });

  describe("Check burn function", function () {
    beforeEach(async function () {
      await this.ruby.connect(this.owner).grantRole(this.burnerRole, this.burner.address);

      this.burnAmount = ethers.utils.parseUnits("1000000", 18);
      await this.ruby.transfer(this.burner.address, this.burnAmount);
    });

    it("something to burn", async function () {
      expect(await this.ruby.balanceOf(this.burner.address)).to.be.gt(0);
    });

    it("only owner can cant burn", async function () {
      await expect(this.burner.connect(this.other).burn()).to.be.revertedWith("Ownable: caller is not the owner");
      
      expect(await this.burner.owner()).to.be.eq(this.owner.address);
      
      expect(await this.ruby.balanceOf(this.burner.address)).to.be.eq(this.burnAmount);
      await this.burner.connect(this.owner).burn();
      expect(await this.ruby.balanceOf(this.burner.address)).to.be.eq(0);
    });

    it("multiple burns are correct", async function () {
      const supply = await this.ruby.totalSupply();
      
      expect(await this.ruby.balanceOf(this.burner.address)).to.be.eq(this.burnAmount);

      // one burn
      expect(await this.ruby.balanceOf(this.burner.address)).to.be.eq(this.burnAmount);
      await this.burner.connect(this.owner).burn();
      expect(await this.ruby.balanceOf(this.burner.address)).to.be.eq(0);
      expect(await this.ruby.totalSupply()).to.be.eq(supply.sub(this.burnAmount));
      expect(await this.burner.burned()).to.be.eq(this.burnAmount);

      // second burn does nothing
      expect(await this.ruby.balanceOf(this.burner.address)).to.be.eq(0);
      await this.burner.connect(this.owner).burn();
      expect(await this.ruby.balanceOf(this.burner.address)).to.be.eq(0);
      expect(await this.ruby.totalSupply()).to.be.eq(supply.sub(this.burnAmount));
      expect(await this.burner.burned()).to.be.eq(this.burnAmount);

    });

  });
});
