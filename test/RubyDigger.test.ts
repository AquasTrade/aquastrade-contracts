const { ethers, network } = require("hardhat");
import { expect } from "chai"
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("RubyDigger", function () {
  before(async function () {
    await prepare(this, ["RubyDigger", "RubyMine", "MockRubyDiggerExploit", "MockERC20", "UniswapV2Factory", "UniswapV2Pair"])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["ruby", this.MockERC20, ["RUBY", "RUBY", getBigNumber("10000000")]],
      ["dai", this.MockERC20, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.MockERC20, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.MockERC20, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.MockERC20, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.MockERC20, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    await deploy(this, [["mine", this.RubyMine, [this.ruby.address]]])
    await deploy(this, [["rubyDigger", this.RubyDigger, [this.factory.address, this.mine.address, this.ruby.address, this.weth.address]]])
    await deploy(this, [["exploiter", this.MockRubyDiggerExploit, [this.rubyDigger.address]]])
    await createSLP(this, "rubyEth", this.ruby, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "rubyUSDC", this.ruby, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
  })
  describe("setBridge", function () {
    it("does not allow to set bridge for Ruby", async function () {
      await expect(this.rubyDigger.setBridge(this.ruby.address, this.weth.address)).to.be.revertedWith("RubyDigger: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.rubyDigger.setBridge(this.weth.address, this.ruby.address)).to.be.revertedWith("RubyDigger: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.rubyDigger.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("RubyDigger: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.rubyDigger.setBridge(this.dai.address, this.ruby.address))
        .to.emit(this.rubyDigger, "LogBridgeSet")
        .withArgs(this.dai.address, this.ruby.address)
    })
  })
  describe("convert", function () {
    it("should convert RUBY - ETH", async function () {
      await this.rubyEth.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyDigger.convert(this.ruby.address, this.weth.address)
      expect(await this.ruby.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.rubyEth.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.ruby.balanceOf(this.mine.address)).to.equal("1897569270781234370")
    })

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyDigger.convert(this.usdc.address, this.weth.address)
      expect(await this.ruby.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.usdcEth.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.ruby.balanceOf(this.mine.address)).to.equal("1590898251382934275")
    })

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyDigger.convert(this.strudel.address, this.weth.address)
      expect(await this.ruby.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.strudelEth.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.ruby.balanceOf(this.mine.address)).to.equal("1590898251382934275")
    })

    it("should convert USDC - RUBY", async function () {
      await this.rubyUSDC.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyDigger.convert(this.usdc.address, this.ruby.address)
      expect(await this.ruby.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.rubyUSDC.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.ruby.balanceOf(this.mine.address)).to.equal("1897569270781234370")
    })

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyDigger.convert(this.dai.address, this.weth.address)
      expect(await this.ruby.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.ruby.balanceOf(this.mine.address)).to.equal("1590898251382934275")
    })

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyDigger.setBridge(this.usdc.address, this.ruby.address)
      await this.rubyDigger.setBridge(this.mic.address, this.usdc.address)
      await this.rubyDigger.convert(this.mic.address, this.usdc.address)
      expect(await this.ruby.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.ruby.balanceOf(this.mine.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyDigger.setBridge(this.usdc.address, this.ruby.address)
      await this.rubyDigger.setBridge(this.dai.address, this.usdc.address)
      await this.rubyDigger.convert(this.dai.address, this.usdc.address)
      expect(await this.ruby.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.daiUSDC.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.ruby.balanceOf(this.mine.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyDigger.setBridge(this.dai.address, this.usdc.address)
      await this.rubyDigger.setBridge(this.mic.address, this.dai.address)
      await this.rubyDigger.convert(this.dai.address, this.mic.address)
      expect(await this.ruby.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.daiMIC.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.ruby.balanceOf(this.mine.address)).to.equal("1200963016721363748")
    })

    it("reverts if it loops back", async function () {
      await this.daiMIC.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyDigger.setBridge(this.dai.address, this.mic.address)
      await this.rubyDigger.setBridge(this.mic.address, this.dai.address)
      await expect(this.rubyDigger.convert(this.dai.address, this.mic.address)).to.be.reverted
    })

    it("reverts if caller is not EOA", async function () {
      await this.rubyEth.transfer(this.rubyDigger.address, getBigNumber(1))
      await expect(this.exploiter.convert(this.ruby.address, this.weth.address)).to.be.revertedWith("RubyDigger: must use EOA")
    })

    it("reverts if pair does not exist", async function () {
      await expect(this.rubyDigger.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith("RubyDigger: Invalid pair")
    })

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.rubyDigger.address, getBigNumber(1))
      await expect(this.rubyDigger.convert(this.mic.address, this.usdc.address)).to.be.revertedWith("RubyDigger: Cannot convert")
      expect(await this.ruby.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.rubyDigger.address)).to.equal(getBigNumber(1))
      expect(await this.ruby.balanceOf(this.mine.address)).to.equal(0)
    })
  })

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyEth.transfer(this.rubyDigger.address, getBigNumber(1))
      await this.rubyDigger.convertMultiple([this.dai.address, this.ruby.address], [this.weth.address, this.weth.address])
      expect(await this.ruby.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.rubyDigger.address)).to.equal(0)
      expect(await this.ruby.balanceOf(this.mine.address)).to.equal("3186583558687783097")
    })
  })

  after(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    })
  })
})