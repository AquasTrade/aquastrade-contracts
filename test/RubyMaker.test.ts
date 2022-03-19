const { ethers, network } = require("hardhat");
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { prepare, deploy, getBigNumber, createSLP, assertRubyConversion } from "./utilities";

import { RubyMaker, RubyTokenMintable } from "../typechain";
import { deployAMM, deployNFTAdmin, deployNftsAndNftAdmin, deployRubyFreeSwapNFT, deployRubyMaker, deployRubyProfileNFT, deployRubyRouter } from "./utilities/deployment";

const {parseUnits, formatUnits} = utils;

describe("RubyMaker", function () {
  const burnPercent = 20; // 20%

  const ONE_UNIT = ethers.utils.parseUnits("1");

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
      ["usdp", this.MockERC20, ["USDP", "USDP", getBigNumber("10000000"), 18]],
      ["dai", this.MockERC20, ["DAI", "DAI", getBigNumber("10000000"), 18]],
      ["ethc", this.MockERC20, ["ETHC", "ETHC", getBigNumber("10000000"), 18]],
      ["link", this.MockERC20, ["LINK", "LINK", getBigNumber("10000000"), 18]],
    ]);



    let {rubyFreeSwapNft, rubyProfileNft, nftAdmin} = await deployNftsAndNftAdmin(this.owner.address)

    this.rubyFreeSwapNft = rubyFreeSwapNft;
    this.rubyProfileNft = rubyProfileNft;
    this.nftAdmin = nftAdmin;


    let {factory, ammRouter } = await deployAMM(this.owner.address, this.nftAdmin.address)

    this.router = ammRouter;
    this.factory = factory;


    this.ruby = <RubyTokenMintable>this.ruby;

    // set pair creators
    await this.factory.setPairCreator(this.owner.address, true);
    await this.factory.setPairCreator(this.router.address, true);

    // deploy the staker with dummy addresses, not really relevant for these tests
    await deploy(this, [["staker", this.RubyStaker, [this.ruby.address]]]);

    this.rubyMaker = await deployRubyMaker(this.owner.address, this.factory.address, this.staker.address, this.ruby.address, this.weth.address, burnPercent)

    const burnerRole = await this.ruby.BURNER_ROLE();

    if ((await this.ruby.hasRole(burnerRole, this.rubyMaker.address)) === false) {
      let res = await this.ruby.grantRole(burnerRole, this.rubyMaker.address);
      await res.wait(1);
    }

    // await this.staker.approveRewardDistributor(0, this.rubyMaker.address, true);
    await this.staker.addReward(this.ruby.address, this.rubyMaker.address);

    await deploy(this, [["exploiter", this.MockRubyMakerExploit, [this.rubyMaker.address]]]);
    await createSLP(this, "rubyEthc", this.ruby, this.ethc, parseUnits("10000"));
    await createSLP(this, "usdpEthc", this.usdp, this.ethc,parseUnits("10000"));
    await createSLP(this, "usdpRuby", this.usdp, this.ruby, parseUnits("10000"));
    await createSLP(this, "usdpDai", this.usdp, this.dai, parseUnits("10000"));
    await createSLP(this, "usdpLink", this.usdp, this.link, parseUnits("10000"));
  });

  describe("RubyMaker state", function () {
    it("should be set correctly after deployment", async function () {
      let ownerAddr = await this.rubyMaker.owner();
      let factoryAddr = await this.rubyMaker.factory();
      let stakerAddr = await this.rubyMaker.rubyStaker();
      let burnPct = await this.rubyMaker.burnPercent();
      let owner = await this.rubyMaker.owner();

      expect(ownerAddr).to.equal(this.owner.address);
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

    it("ruby token should be successfully changed by the owner", async function () {

    });

    it("usdt token should be successfully changed by the owner", async function () {

    });

    it("amm factory should be successfully changed by the owner", async function () {

    });

    it("ruby staker should be successfully changed by the owner", async function () {

    });

    it("LP should be withdrawal should be successful by the owner", async function () {

    });
  });
  describe("convert", function () {
    it("should convert RUBY - ETHC", async function () {
      // const rubyConvertedAmount = BigNumber.from("1897569270781234370");
      const rubyConvertedAmount = BigNumber.from("1280308753411053458532");
      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.rubyEth.transfer(this.rubyMaker.address, ethers.utils.parseUnits("663"));
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
        rubyTotalSupplyAfterConvert
      );
    });

    it("should convert USDP - ETHC", async function () {
      const rubyConvertedAmount = BigNumber.from("1891518710977119193");

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

    it("should convert USDP - RUBY", async function () {
      const rubyConvertedAmount = BigNumber.from("1891518710977119193");

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

    it("should convert USDP - LINK", async function () {
      const rubyConvertedAmount = BigNumber.from("1891518710977119193");

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


    it("should convert USDP - DAI", async function () {
      const rubyConvertedAmount = BigNumber.from("1891518710977119193");

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
    it("should convert using standard ETH path", async function () {
      const rubyConvertedAmount = BigNumber.from("1891518710977119193");

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
      const rubyConvertedAmount = BigNumber.from("1891518710977119193").add(BigNumber.from("1996522881585469454"));
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

    it("should allow to convert multiple, rough numbers", async function () {
      const rubyConvertedAmount = BigNumber.from("6372424416696802402").add(BigNumber.from("1088334208464609014882"));
      // Get supply before conversion
      const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

      // Transfer and convert
      await this.daiEth.transfer(this.rubyMaker.address, getBigNumber(4));
      await this.rubyEth.transfer(this.rubyMaker.address, getBigNumber(561));
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
