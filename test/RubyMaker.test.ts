const { ethers, network } = require("hardhat");
import { expect } from "chai";
import { BigNumber } from "ethers";
import { prepare, deploy, getBigNumber, createSLP, assertRubyConversion } from "./utilities";

import { RubyMaker, RubyTokenMintable } from "../typechain";

describe("RubyMaker", function () {
  const burnPercent = 20; // 20%

  before(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    await prepare(this, [
      "RubyMaker",
      "RubyStaker",
      "RubyTokenMintable",
      "MockRubyMakerExploit",
      "MockERC20",
      "UniswapV2Factory",
      "UniswapV2Router02",
      "UniswapV2Pair",
    ]);
  });

  beforeEach(async function () {
    await deploy(this, [
      ["ruby", this.RubyTokenMintable, []],
      ["dai", this.MockERC20, ["DAI", "DAI", getBigNumber("10000000"), 18]],
      ["mic", this.MockERC20, ["MIC", "MIC", getBigNumber("10000000"), 18]],
      ["usdc", this.MockERC20, ["USDC", "USDC", getBigNumber("10000000"), 18]],
      ["weth", this.MockERC20, ["WETH", "ETH", getBigNumber("10000000"), 18]],
      ["strudel", this.MockERC20, ["$TRDL", "$TRDL", getBigNumber("10000000"), 18]],
      ["factory", this.UniswapV2Factory, [this.owner.address]],
    ]);

    await deploy(this, [
      ["router", this.UniswapV2Router02, [this.factory.address]],
    ])

    this.ruby = <RubyTokenMintable>this.ruby;

    // set pair creators
    await this.factory.setPairCreator(this.owner.address);
    await this.factory.setPairCreator(this.router.address);


    // deploy the staker with dummy addresses, not really relevant for these tests
    await deploy(this, [["staker", this.RubyStaker, [this.ruby.address]]]);
    await deploy(this, [
      [
        "rubyMaker",
        this.RubyMaker,
        [this.factory.address, this.staker.address, this.ruby.address, this.weth.address, burnPercent],
      ],
    ]);

    const burnerRole = await this.ruby.BURNER_ROLE();
  
    if ((await this.ruby.hasRole(burnerRole, this.rubyMaker.address)) === false) {
        let res = await this.ruby.grantRole(burnerRole, this.rubyMaker.address);
      await res.wait(1);
    }

    // await this.staker.approveRewardDistributor(0, this.rubyMaker.address, true);
    await this.staker.addReward(this.ruby.address, this.rubyMaker.address);
    await this.ruby.a

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

  describe("RubyMaker state", function () {
    it("should be set correctly after deployment", async function () {
      let factoryAddr = await this.rubyMaker.factory();
      let stakerAddr = await this.rubyMaker.rubyStaker();
      let burnPct = await this.rubyMaker.burnPercent();
      let owner = await this.rubyMaker.owner();

      expect(factoryAddr).to.equal(this.factory.address);
      expect(stakerAddr).to.equal(this.staker.address);
      expect(burnPct).to.equal(burnPercent);
      expect(owner).to.equal(this.signers[0].address);
    });

    it("burn percent should be updated correctly by the owner if it is within the correct range", async function () {
      // assert burn percent before change
      let burnPct = await this.rubyMaker.burnPercent();
      expect(burnPct).to.equal(burnPercent);

      // change burn percent and assert
      const newBurnPercent = 30;
      await expect(this.rubyMaker.setBurnPercent(newBurnPercent))
        .to.emit(this.rubyMaker, "BurnPercentChanged")
        .withArgs(newBurnPercent);

      burnPct = await this.rubyMaker.burnPercent();
      expect(burnPct).to.equal(newBurnPercent);
    });

    it("burn percent update should fail if it is incorrect", async function () {
      // assert burn percent before change
      let burnPct = await this.rubyMaker.burnPercent();
      expect(burnPct).to.equal(burnPercent);

      // change burn percent and assert
      const newBurnPercent = 101;
      await expect(this.rubyMaker.setBurnPercent(newBurnPercent)).to.be.revertedWith(
        "RubyMaker: Invalid burn percent.",
      );
    });

    it("burn percent update should fail if it is not updated by the owner", async function () {
      // assert burn percent before change
      let burnPct = await this.rubyMaker.burnPercent();
      expect(burnPct).to.equal(burnPercent);

      // change burn percent and assert
      const newBurnPercent = 25;
      await expect(this.rubyMaker.connect(this.signers[1]).setBurnPercent(newBurnPercent)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
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
      const rubyConvertedAmount = BigNumber.from("1897569270781234370");
      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.rubyEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convert(this.ruby.address, this.weth.address);

      // Get supply after conversion
      const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

      // Assert
      await assertRubyConversion(
        this,
        burnPercent,
        this.rubyEth,
        rubyConvertedAmount,
        rubyTotalSupplyBeforeConvert,
        rubyTotalSupplyAfterConvert,
      );
    });

    it("should convert USDC - ETH", async function () {
      const rubyConvertedAmount = BigNumber.from("1590898251382934275");

      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.usdcEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convert(this.usdc.address, this.weth.address);

      // Get supply after conversion
      const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

      // Assert
      await assertRubyConversion(
        this,
        burnPercent,
        this.usdcEth,
        rubyConvertedAmount,
        rubyTotalSupplyBeforeConvert,
        rubyTotalSupplyAfterConvert,
      );
    });

    it("should convert $TRDL - ETH", async function () {
      const rubyConvertedAmount = BigNumber.from("1590898251382934275");

      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.strudelEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convert(this.strudel.address, this.weth.address);

      // Get supply after conversion
      const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

      // Assert
      await assertRubyConversion(
        this,
        burnPercent,
        this.strudelEth,
        rubyConvertedAmount,
        rubyTotalSupplyBeforeConvert,
        rubyTotalSupplyAfterConvert,
      );
    });

    it("should convert USDC - RUBY", async function () {
      const rubyConvertedAmount = BigNumber.from("1897569270781234370");

      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.rubyUSDC.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convert(this.usdc.address, this.ruby.address);

      // Get supply after conversion
      const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

      // Assert
      await assertRubyConversion(
        this,
        burnPercent,
        this.rubyUSDC,
        rubyConvertedAmount,
        rubyTotalSupplyBeforeConvert,
        rubyTotalSupplyAfterConvert,
      );
    });

    it("should convert using standard ETH path", async function () {
      const rubyConvertedAmount = BigNumber.from("1590898251382934275");

      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.daiEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convert(this.dai.address, this.weth.address);

      // Get supply after conversion
      const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

      // Assert
      await assertRubyConversion(
        this,
        burnPercent,
        this.daiEth,
        rubyConvertedAmount,
        rubyTotalSupplyBeforeConvert,
        rubyTotalSupplyAfterConvert,
      );
    });

    it("converts MIC/USDC using more complex path", async function () {
      const rubyConvertedAmount = BigNumber.from("1590898251382934275");

      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.micUSDC.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.setBridge(this.usdc.address, this.ruby.address);
      await this.rubyMaker.setBridge(this.mic.address, this.usdc.address);
      await this.rubyMaker.convert(this.mic.address, this.usdc.address);

      // Get supply after conversion
      const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

      // Assert
      await assertRubyConversion(
        this,
        burnPercent,
        this.micUSDC,
        rubyConvertedAmount,
        rubyTotalSupplyBeforeConvert,
        rubyTotalSupplyAfterConvert,
      );
    });

    it("converts DAI/USDC using more complex path", async function () {
      const rubyConvertedAmount = BigNumber.from("1590898251382934275");
      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.daiUSDC.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.setBridge(this.usdc.address, this.ruby.address);
      await this.rubyMaker.setBridge(this.dai.address, this.usdc.address);
      await this.rubyMaker.convert(this.dai.address, this.usdc.address);

      // Get supply after conversion
      const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

      // Assert
      await assertRubyConversion(
        this,
        burnPercent,
        this.daiUSDC,
        rubyConvertedAmount,
        rubyTotalSupplyBeforeConvert,
        rubyTotalSupplyAfterConvert,
      );
    });

    it("converts DAI/MIC using two step path", async function () {
      const rubyConvertedAmount = BigNumber.from("1200963016721363748");
      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.daiMIC.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.setBridge(this.dai.address, this.usdc.address);
      await this.rubyMaker.setBridge(this.mic.address, this.dai.address);
      await this.rubyMaker.convert(this.dai.address, this.mic.address);

      // Get supply after conversion
      const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

      // Assert
      await assertRubyConversion(
        this,
        burnPercent,
        this.daiMIC,
        rubyConvertedAmount,
        rubyTotalSupplyBeforeConvert,
        rubyTotalSupplyAfterConvert,
      );
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
      expect(await this.ruby.balanceOf(this.staker.address)).to.equal(0);
    });
  });

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      const rubyConvertedAmount = BigNumber.from("3186583558687783097");
      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.daiEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyEth.transfer(this.rubyMaker.address, getBigNumber(1));
      await this.rubyMaker.convertMultiple(
        [this.dai.address, this.ruby.address],
        [this.weth.address, this.weth.address],
      );

      // Get supply after conversion
      const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

      // Assert
      await assertRubyConversion(
        this,
        burnPercent,
        this.daiEth,
        rubyConvertedAmount,
        rubyTotalSupplyBeforeConvert,
        rubyTotalSupplyAfterConvert,
      );
      expect(await this.rubyEth.balanceOf(this.rubyMaker.address)).to.equal(0);
    });
  });

  after(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
