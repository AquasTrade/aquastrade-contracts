const { ethers, network } = require("hardhat");
import { expect } from "chai";
import { BigNumber } from "ethers";
import { prepare, deploy, getBigNumber, createSLP, ADDRESS_ZERO } from "./utilities";

describe("RubyMaker", function () {

  const burnPercent = 20;
  const makerBurnAllowance = ethers.utils.parseUnits((200_000_000).toString(), 18);

  before(async function () {
    this.signers = await ethers.getSigners();

    await prepare(this, [
      "RubyMaker",
      "RubyBar",
      "RubyToken",
      "MockRubyMakerExploit",
      "MockERC20",
      "UniswapV2Factory",
      "UniswapV2Pair",
    ]);
  });

  beforeEach(async function () {


    await deploy(this, [
      ["ruby", this.RubyToken, []],
      ["dai", this.MockERC20, ["DAI", "DAI", getBigNumber("10000000"),  18]],
      ["mic", this.MockERC20, ["MIC", "MIC", getBigNumber("10000000"),  18]],
      ["usdc", this.MockERC20, ["USDC", "USDC", getBigNumber("10000000"),  18]],
      ["weth", this.MockERC20, ["WETH", "ETH", getBigNumber("10000000"),  18]],
      ["strudel", this.MockERC20, ["$TRDL", "$TRDL", getBigNumber("10000000"),  18]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ]);

    await this.ruby.mint(this.signers[0].address, getBigNumber("10000000"))

    await deploy(this, [["bar", this.RubyBar, [this.ruby.address]]]);
    await deploy(this, [
      ["rubyMaker", this.RubyMaker, [this.factory.address, this.bar.address, this.ruby.address, this.weth.address, burnPercent]],
    ]);

    await this.bar.setMakerAllowance(this.rubyMaker.address, makerBurnAllowance);

    await deploy(this, [["exploiter", this.MockRubyMakerExploit, [this.rubyMaker.address]]]);
    await createSLP(this, "rubyEth", this.ruby, this.weth, getBigNumber(10));
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10));
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10));
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10));
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10));
    await createSLP(this, "rubyUSDC", this.ruby, this.usdc, getBigNumber(10));
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10));
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10));
  });
  describe("setBridge", function () {
    it("does not allow to set bridge for Ruby", async function () {
      await expect(this.rubyMaker.setBridge(this.ruby.address, this.weth.address)).to.be.revertedWith(
        "RubyMaker: Invalid bridge",
      );
    });

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.rubyMaker.setBridge(this.weth.address, this.ruby.address)).to.be.revertedWith(
        "RubyMaker: Invalid bridge",
      );
    });

    it("does not allow to set bridge to itself", async function () {
      await expect(this.rubyMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith(
        "RubyMaker: Invalid bridge",
      );
    });

    it("emits correct event on bridge", async function () {
      await expect(this.rubyMaker.setBridge(this.dai.address, this.ruby.address))
        .to.emit(this.rubyMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.ruby.address);
    });
  });
  describe("convert", function () {
    it("should convert RUBY - ETH", async function () {
      await this.rubyEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convert(this.ruby.address, this.weth.address);
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.rubyEth.balanceOf(this.rubyMaker.address)).to.equal(0);

      const totalAmount = BigNumber.from("1897569270781234370");
      const barBalance = await this.ruby.balanceOf(this.bar.address);
      const zeroAddrBalance = await this.ruby.balanceOf(this.bar.address);
      console.log("bar balance", barBalance.toString());
      // const distributed = totalAmount.mul((BigNumber.from(80).div(BigNumber.from(100))));
      // const burned =  totalAmount.mul((BigNumber.from(20).div(BigNumber.from(100))));


      console.log("total amount string", totalAmount.toString())
      // console.log("distributed", distributed.toString())
      // console.log("burned", burned.toString())

      // expect(await this.ruby.balanceOf(this.bar.address)).to.equal(distributed.toString());
    });

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convert(this.usdc.address, this.weth.address);
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.usdcEth.balanceOf(this.rubyMaker.address)).to.equal(0);
      // expect(await this.ruby.balanceOf(this.bar.address)).to.equal("1590898251382934275");
    });

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convert(this.strudel.address, this.weth.address);
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.strudelEth.balanceOf(this.rubyMaker.address)).to.equal(0);
      // expect(await this.ruby.balanceOf(this.bar.address)).to.equal("1590898251382934275");
    });

    it("should convert USDC - RUBY", async function () {
      await this.rubyUSDC.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convert(this.usdc.address, this.ruby.address);
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.rubyUSDC.balanceOf(this.rubyMaker.address)).to.equal(0);
      // expect(await this.ruby.balanceOf(this.bar.address)).to.equal("1897569270781234370");
    });

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convert(this.dai.address, this.weth.address);
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.daiEth.balanceOf(this.rubyMaker.address)).to.equal(0);
      // expect(await this.ruby.balanceOf(this.bar.address)).to.equal("1590898251382934275");
    });

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.setBridge(this.usdc.address, this.ruby.address);
      await this.rubyMaker.setBridge(this.mic.address, this.usdc.address);
      await this.rubyMaker.convert(this.mic.address, this.usdc.address);
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.micUSDC.balanceOf(this.rubyMaker.address)).to.equal(0);
      // expect(await this.ruby.balanceOf(this.bar.address)).to.equal("1590898251382934275");
    });

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.setBridge(this.usdc.address, this.ruby.address);
      await this.rubyMaker.setBridge(this.dai.address, this.usdc.address);
      await this.rubyMaker.convert(this.dai.address, this.usdc.address);
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.daiUSDC.balanceOf(this.rubyMaker.address)).to.equal(0);
      // expect(await this.ruby.balanceOf(this.bar.address)).to.equal("1590898251382934275");
    });

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.setBridge(this.dai.address, this.usdc.address);
      await this.rubyMaker.setBridge(this.mic.address, this.dai.address);
      await this.rubyMaker.convert(this.dai.address, this.mic.address);
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.daiMIC.balanceOf(this.rubyMaker.address)).to.equal(0);
      // expect(await this.ruby.balanceOf(this.bar.address)).to.equal("1200963016721363748");
    });

    it("reverts if it loops back", async function () {
      await this.daiMIC.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.setBridge(this.dai.address, this.mic.address);
      await this.rubyMaker.setBridge(this.mic.address, this.dai.address);
      await expect(this.rubyMaker.convert(this.dai.address, this.mic.address)).to.be.reverted;
    });

    it("reverts if caller is not EOA", async function () {
      await this.rubyEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await expect(this.exploiter.convert(this.ruby.address, this.weth.address)).to.be.revertedWith(
        "RubyMaker: must use EOA",
      );
    });

    it("reverts if pair does not exist", async function () {
      await expect(this.rubyMaker.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith(
        "RubyMaker: Invalid pair",
      );
    });

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.rubyMaker.address, getBigNumber(1));
      await expect(this.rubyMaker.convert(this.mic.address, this.usdc.address)).to.be.revertedWith(
        "RubyMaker: Cannot convert",
      );
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.micUSDC.balanceOf(this.rubyMaker.address)).to.equal(getBigNumber(1));
      expect(await this.ruby.balanceOf(this.bar.address)).to.equal(0);
    });
  });

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convertMultiple(
        [this.dai.address, this.ruby.address],
        [this.weth.address, this.weth.address],
      );
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.daiEth.balanceOf(this.rubyMaker.address)).to.equal(0);
      // expect(await this.ruby.balanceOf(this.bar.address)).to.equal("3186583558687783097");
    });
  });

  after(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
