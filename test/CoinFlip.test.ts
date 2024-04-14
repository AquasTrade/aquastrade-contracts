const { ethers, network } = require("hardhat");
import { expect } from "chai";
import { utils } from "ethers";
import { deploy } from "./utilities";

describe("CoinFl", function () {
  before(async function () {
    const transferAmount = ethers.utils.parseUnits("100000", 18);

    this.Flipper = await ethers.getContractFactory("CoinFlip");
    this.RNG = await ethers.getContractFactory("RNG_CoinFlip");
    this.signers = await ethers.getSigners();
    this.alice = this.signers[0];
    this.bob = this.signers[1];
    this.carol = this.signers[2];

    let MockERC20 = await ethers.getContractFactory("MockERC20");
    this.erc20 = await MockERC20.deploy(`Mock token`, `MTK`, ethers.utils.parseUnits("10000000000", 18), 18);
    await this.erc20.deployed();

    await this.erc20.transfer(this.alice.address, transferAmount);

    this.rngCoinFlipper = await this.RNG.deploy();
    this.coinFlipper = await this.Flipper.deploy(this.erc20.address, this.rngCoinFlipper.address);
    await this.coinFlipper.deployed();

    await this.erc20.approve(this.coinFlipper.address, transferAmount);
  });

  beforeEach(async function () {
    const address = await this.coinFlipper.RNG();
    this.payToken = await this.coinFlipper.PayToken();
    console.log("RNG", address);
    console.log("Token", this.payToken);
  });

  it("should have tokens", async function () {
    const totalSupply = await this.erc20.totalSupply();
    const aliceBal = await this.erc20.balanceOf(this.alice.address);

    expect(totalSupply).to.equal("10000000000000000000000000000");
    expect(aliceBal).to.equal("10000000000000000000000000000");

    const betAmount = ethers.utils.parseUnits("1", 18);

    for (let index = 0; index < 10; index++) {
      const tx = await this.coinFlipper.flipCoin(betAmount);
      await tx.wait(1);
    }
  });

  it("should have correct win", async function () {
    const win = await this.coinFlipper.totalWins(this.alice.address);
    console.log("WINS", win);

    const loss = await this.coinFlipper.totalLoss(this.alice.address);
    console.log("LOSS", loss);

    const bet = await this.coinFlipper.totalBets(this.alice.address);
    console.log("BETS", bet);

    const bal = await this.coinFlipper.balances(this.alice.address);
    console.log("BALANCE", bal);
  });

  it("should only allow minter to mint token", async function () {
    /*
    const totalSupply = await this.ruby.totalSupply();
    const aliceBal = await this.ruby.balanceOf(this.alice.address);
    
    expect(totalSupply).to.equal("1100");
  */
  });

  it("should fail if you try to do bad transfers", async function () {
    /*
    await this.ruby.mint(this.alice.address, "100");
    await expect(this.ruby.transfer(this.carol.address, "110")).to.be.revertedWith(
      "ERC20: transfer amount exceeds balance",
    );
    await expect(
      this.ruby.connect(this.bob).transfer(this.carol.address, "1", { from: this.bob.address }),
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

    */
  });

  after(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
