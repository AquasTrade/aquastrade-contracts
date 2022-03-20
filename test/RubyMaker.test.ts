const { ethers, network } = require("hardhat");
import { expect } from "chai";
import { BigNumber, utils, constants } from "ethers";
import { prepare, deploy, getBigNumber, createRLP, assertRubyConversion } from "./utilities";

import { RubyMaker, RubyTokenMintable } from "../typechain";
import { deployAMM, deployNFTAdmin, deployNftsAndNftAdmin, deployRubyFreeSwapNFT, deployRubyMaker, deployRubyProfileNFT, deployRubyRouter } from "./utilities/deployment";

const {parseUnits, formatUnits} = utils;

const {AddressZero} = constants;

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
      "RubyToken",
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
      ["rubyTokenTest", this.RubyToken, []],
      ["usdp", this.MockERC20, ["USDP", "USDP", getBigNumber("10000000"), 18]],
      ["usdc", this.MockERC20, ["USDC", "USDC", getBigNumber("10000000"), 18]],
      ["usdt", this.MockERC20, ["USDT", "USDT", getBigNumber("10000000"), 18]],
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

    this.rubyMaker = await deployRubyMaker(this.owner.address, this.factory.address, this.staker.address, this.ruby.address, this.usdp.address, burnPercent)

    const burnerRole = await this.ruby.BURNER_ROLE();

    if ((await this.ruby.hasRole(burnerRole, this.rubyMaker.address)) === false) {
      let res = await this.ruby.grantRole(burnerRole, this.rubyMaker.address);
      await res.wait(1);
    }

    // await this.staker.approveRewardDistributor(0, this.rubyMaker.address, true);
    await this.staker.addReward(this.ruby.address, this.rubyMaker.address);

    await deploy(this, [["exploiter", this.MockRubyMakerExploit, [this.rubyMaker.address]]]);
    await createRLP(this, "rubyEthc", this.ruby, this.ethc, parseUnits("10000"));
    await createRLP(this, "usdpEthc", this.usdp, this.ethc, parseUnits("10000"));
    await createRLP(this, "usdpRuby", this.usdp, this.ruby, parseUnits("10000"));
    await createRLP(this, "usdpDai", this.usdp, this.dai, parseUnits("10000"));
    await createRLP(this, "usdpLink", this.usdp, this.link, parseUnits("10000"));
    await createRLP(this, "usdcUsdt", this.usdc, this.usdt, parseUnits("10000"));
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
        .to.emit(this.rubyMaker, "BurnPercentSet")
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
        "Ownable: caller is not the owner"
      );
    });

    it("ruby token should be successfully set by the owner", async function () {

      expect(await this.rubyMaker.ruby()).to.be.eq(this.ruby.address);

      await expect(this.rubyMaker.setRubyToken(this.rubyTokenTest.address))
      .to.emit(this.rubyMaker, "RubyTokenSet")
      .withArgs(this.rubyTokenTest.address);

      expect(await this.rubyMaker.ruby()).to.be.eq(this.rubyTokenTest.address);

    });

    it("ruby token should not be set when the token address is invalid", async function () {

      const rubyPrevAddr = await this.rubyMaker.ruby();
      await expect(this.rubyMaker.setRubyToken(AddressZero)).to.be.revertedWith("RubyMaker: Invalid ruby token address.");
      const rubyCurrAdddr = await this.rubyMaker.ruby();
      expect(rubyPrevAddr).to.be.eq(rubyCurrAdddr);

    });

    it("ruby token should not be set when the caller is not the owner", async function () {

      const rubyPrevAddr = await this.rubyMaker.ruby();
      await expect(this.rubyMaker.connect(this.signers[1]).setRubyToken(this.ruby.address)).to.be.revertedWith("Ownable: caller is not the owner");
      const rubyCurrAdddr = await this.rubyMaker.ruby();
      expect(rubyPrevAddr).to.be.eq(rubyCurrAdddr);

    });

    it("usd token should be successfully changed by the owner", async function () {


      expect(await this.rubyMaker.usdToken()).to.be.eq(this.usdp.address);

      await expect(this.rubyMaker.setUsdToken(this.usdc.address))
      .to.emit(this.rubyMaker, "UsdTokenSet")
      .withArgs(this.usdc.address);

      expect(await this.rubyMaker.usdToken()).to.be.eq(this.usdc.address);


    });


    it("usd token should not be set when the token address is invalid", async function () {

      const usdPrevAddr = await this.rubyMaker.usdToken();
      await expect(this.rubyMaker.setUsdToken(AddressZero)).to.be.revertedWith("RubyMaker: Invalid USD token address.");
      const usdCurrAddr = await this.rubyMaker.usdToken();
      expect(usdPrevAddr).to.be.eq(usdCurrAddr);

    });


    it("usd token should not be set when the caller is not the owner", async function () {

      const usdPrevAddr = await this.rubyMaker.usdToken();
      await expect(this.rubyMaker.connect(this.signers[1]).setUsdToken(this.usdp.address)).to.be.revertedWith("Ownable: caller is not the owner");
      const usdCurrAddr = await this.rubyMaker.usdToken();
      expect(usdPrevAddr).to.be.eq(usdCurrAddr);

    });


    it("amm factory should be successfully changed by the owner", async function () {

      // Testing purposes only, to validate address change
      const newAmmFactory = this.usdp.address;

      expect(await this.rubyMaker.factory()).to.be.eq(this.factory.address);

      await expect(this.rubyMaker.setAmmFactory(newAmmFactory))
      .to.emit(this.rubyMaker, "AmmFactorySet")
      .withArgs(newAmmFactory);

      expect(await this.rubyMaker.factory()).to.be.eq(newAmmFactory);

    });

    it("amm factory should not be set when the factory address is invalid", async function () {

      const factoryPrevAddr = await this.rubyMaker.factory();
      await expect(this.rubyMaker.setAmmFactory(AddressZero)).to.be.revertedWith("RubyMaker: Invalid AMM factory address.");
      const factoryCurrAdr = await this.rubyMaker.factory();
      expect(factoryPrevAddr).to.be.eq(factoryCurrAdr);

    });


    it("amm factory should not be set when the caller is not the owner", async function () {

      const factoryPrevAddr = await this.rubyMaker.factory();
      await expect(this.rubyMaker.connect(this.signers[1]).setAmmFactory(this.factory.address)).to.be.revertedWith("Ownable: caller is not the owner");
      const factoryCurrAdr = await this.rubyMaker.factory();
      expect(factoryPrevAddr).to.be.eq(factoryCurrAdr);

    });

    it("ruby staker should be successfully changed by the owner", async function () {

      // Testing purposes only, to validate address change
      const newRubyStaker = this.usdp.address;

      expect(await this.rubyMaker.rubyStaker()).to.be.eq(this.staker.address);

      await expect(this.rubyMaker.setRubyStaker(newRubyStaker))
      .to.emit(this.rubyMaker, "RubyStakerSet")
      .withArgs(newRubyStaker);

      expect(await this.rubyMaker.rubyStaker()).to.be.eq(newRubyStaker);

    });

    it("ruby staker should not be set when the staker address is invalid", async function () {

      const rubyStakerPrevAddr = await this.rubyMaker.rubyStaker();
      await expect(this.rubyMaker.setRubyStaker(AddressZero)).to.be.revertedWith("RubyMaker: Invalid rubyStaker address.");
      const rubyStakerCurrAddr = await this.rubyMaker.rubyStaker();
      expect(rubyStakerPrevAddr).to.be.eq(rubyStakerCurrAddr);

    });


    it("ruby staker should not be set when the caller is not the owner", async function () {

      const rubyStakerPrevAddr = await this.rubyMaker.rubyStaker();
      await expect(this.rubyMaker.connect(this.signers[1]).setRubyStaker(this.staker.address)).to.be.revertedWith("Ownable: caller is not the owner");
      const rubyStakerCurrAddr = await this.rubyMaker.rubyStaker();
      expect(rubyStakerPrevAddr).to.be.eq(rubyStakerCurrAddr);


    });

    it("LP should be withdrawal should be successful by the owner", async function () {

      const ownerBalanceBeforeTransfer = await this.usdcUsdt.balanceOf(this.owner.address);
      await this.usdcUsdt.transfer(this.rubyMaker.address, parseUnits("1"));
      await expect(this.rubyMaker.convert(this.usdc.address, this.usdt.address)).to.be.revertedWith(
        "RubyMaker: Conversion unsupported."
      );

      const oneUnit = parseUnits("1");
      expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
      expect(await this.usdcUsdt.balanceOf(this.rubyMaker.address)).to.equal(oneUnit);
      expect(await this.usdcUsdt.balanceOf(this.owner.address)).to.equal(ownerBalanceBeforeTransfer.sub(oneUnit));
      expect(await this.ruby.balanceOf(this.staker.address)).to.equal(0);


      await expect(this.rubyMaker.withdrawLP(this.usdcUsdt.address))
      .to.emit(this.rubyMaker, "PairWithdrawn")
      .withArgs(this.usdcUsdt.address, oneUnit);

      expect(await this.usdcUsdt.balanceOf(this.owner.address)).to.equal(ownerBalanceBeforeTransfer);



    });
  });
  // describe("convert", function () {
  //   it("should convert RUBY - ETHC", async function () {
  //     // const rubyConvertedAmount = BigNumber.from("1897569270781234370");
  //     const rubyConvertedAmount = BigNumber.from("1280308753411053458532");
  //     // Get supply before conversion
  //     const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

  //     // Transfer and convert
  //     await this.rubyEthc.transfer(this.rubyMaker.address, parseUnits("663"));
  //     await this.rubyMaker.convert(this.ruby.address, this.ethc.address);

  //     // Get supply after conversion
  //     const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();


  //     // Assert
  //     await assertRubyConversion(
  //       this,
  //       burnPercent,
  //       this.rubyEthc,
  //       rubyConvertedAmount,
  //       rubyTotalSupplyBeforeConvert,
  //       rubyTotalSupplyAfterConvert
  //     );
  //   });

  //   it("should convert USDP - ETHC", async function () {
  //     const rubyConvertedAmount = BigNumber.from("1990513603949493228");

  //     // Get supply before conversion
  //     const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

  //     // Transfer and convert
  //     await this.usdpEthc.transfer(this.rubyMaker.address, parseUnits("1"));
  //     await this.rubyMaker.convert(this.usdp.address, this.ethc.address);

  //     // Get supply after conversion
  //     const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

  //     // Assert
  //     await assertRubyConversion(
  //       this,
  //       burnPercent,
  //       this.usdpEthc,
  //       rubyConvertedAmount,
  //       rubyTotalSupplyBeforeConvert,
  //       rubyTotalSupplyAfterConvert,
  //     );
  //   });

  //   it("should convert USDP - RUBY", async function () {
  //     const rubyConvertedAmount = BigNumber.from("1996900599070179721");

  //     // Get supply before conversion
  //     const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

  //     // Transfer and convert
  //     await this.usdpRuby.transfer(this.rubyMaker.address, parseUnits("1"));
  //     await this.rubyMaker.convert(this.usdp.address, this.ruby.address);

  //     // Get supply after conversion
  //     const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

  //     // Assert
  //     await assertRubyConversion(
  //       this,
  //       burnPercent,
  //       this.usdpRuby,
  //       rubyConvertedAmount,
  //       rubyTotalSupplyBeforeConvert,
  //       rubyTotalSupplyAfterConvert,
  //     );
  //   });

  //   it("should convert USDP - LINK", async function () {
  //     const rubyConvertedAmount = BigNumber.from("1990513603949493228");

  //     // Get supply before conversion
  //     const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

  //     // Transfer and convert
  //     await this.usdpLink.transfer(this.rubyMaker.address, getBigNumber(1));
  //     await this.rubyMaker.convert(this.usdp.address, this.link.address);

  //     // Get supply after conversion
  //     const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

  //     // Assert
  //     await assertRubyConversion(
  //       this,
  //       burnPercent,
  //       this.usdpLink,
  //       rubyConvertedAmount,
  //       rubyTotalSupplyBeforeConvert,
  //       rubyTotalSupplyAfterConvert,
  //     );
  //   });


  //   it("should convert USDP - DAI", async function () {
  //     const rubyConvertedAmount = BigNumber.from("1990513603949493228");

  //     // Get supply before conversion
  //     const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

  //     // Transfer and convert
  //     await this.usdpDai.transfer(this.rubyMaker.address, parseUnits("1"));
  //     await this.rubyMaker.convert(this.usdp.address, this.dai.address);

  //     // Get supply after conversion
  //     const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

  //     // Assert
  //     await assertRubyConversion(
  //       this,
  //       burnPercent,
  //       this.usdpDai,
  //       rubyConvertedAmount,
  //       rubyTotalSupplyBeforeConvert,
  //       rubyTotalSupplyAfterConvert,
  //     );
  //   });

  //   it("reverts if caller is not EOA", async function () {
  //     await this.rubyEthc.transfer(this.rubyMaker.address, getBigNumber(1));
  //     await expect(this.exploiter.convert(this.ruby.address, this.ethc.address)).to.be.revertedWith(
  //       "RubyMaker: must use EOA",
  //     );
  //   });

  //   it("reverts if token0 is invalid", async function () {
  //     await expect(this.rubyMaker.convert(AddressZero, this.usdp.address)).to.be.revertedWith(
  //       "RubyMaker: token0 cannot be the zero address.",
  //     );
  //   });

  //   it("reverts if token1 is invalid", async function () {
  //     await expect(this.rubyMaker.convert(this.usdp.address, AddressZero)).to.be.revertedWith(
  //       "RubyMaker: token1 cannot be the zero address.",
  //     );
  //   });

  //   it("reverts if token0 and token1 are the same", async function () {
  //     await expect(this.rubyMaker.convert(this.ruby.address, this.ruby.address)).to.be.revertedWith(
  //       "RubyMaker: token0 and token1 cannot be the same token."
  //     );
  //   });

  //   it("reverts if pair does not exist", async function () {
  //     await expect(this.rubyMaker.convert(this.usdp.address, this.usdcUsdt.address)).to.be.revertedWith(
  //       "RubyMaker: Invalid pair."
  //     );
  //   });

  //   it("reverts if tokens are unsupoorted", async function () {
  //     await this.usdcUsdt.transfer(this.rubyMaker.address, parseUnits("1"));
  //     await expect(this.rubyMaker.convert(this.usdc.address, this.usdt.address)).to.be.revertedWith(
  //       "RubyMaker: Conversion unsupported."
  //     );
  //     expect(await this.ruby.balanceOf(this.rubyMaker.address)).to.equal(0);
  //     expect(await this.usdcUsdt.balanceOf(this.rubyMaker.address)).to.equal(parseUnits("1"));
  //     expect(await this.ruby.balanceOf(this.staker.address)).to.equal(0);
  //   });
  // });

  // describe("convertMultiple", function () {
  //   it("should allow to convert multiple", async function () {
  //     const rubyConvertedAmount = BigNumber.from("1996900599070179721").add(BigNumber.from("1990116118168674819"));
  //     // Get supply before conversion
  //     const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

  //     // Transfer and convert
  //     await this.usdpRuby.transfer(this.rubyMaker.address, parseUnits("1"));
  //     await this.usdpEthc.transfer(this.rubyMaker.address, parseUnits("1"));
  //     await this.rubyMaker.convertMultiple(
  //       [this.usdp.address, this.usdp.address],
  //       [this.ruby.address, this.ethc.address],
  //     );

  //     // Get supply after conversion
  //     const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

  //     // Assert
  //     await assertRubyConversion(
  //       this,
  //       burnPercent,
  //       this.usdpRuby,
  //       rubyConvertedAmount,
  //       rubyTotalSupplyBeforeConvert,
  //       rubyTotalSupplyAfterConvert,
  //     );
  //     expect(await this.usdpEthc.balanceOf(this.rubyMaker.address)).to.equal(0);
  //   });

  //   it("should allow to convert multiple, rough numbers", async function () {
  //     const rubyConvertedAmount = BigNumber.from("7986409583691500429").add(BigNumber.from("978637331194792339873"));
  //     // Get supply before conversion
  //     const rubyTotalSupplyBeforeConvert = await this.ruby.totalSupply();

  //     // Transfer and convert
  //     await this.usdpRuby.transfer(this.rubyMaker.address, parseUnits("4"));
  //     await this.usdpEthc.transfer(this.rubyMaker.address, parseUnits("561"));
  //     await this.rubyMaker.convertMultiple(
  //       [this.usdp.address, this.usdp.address],
  //       [this.ruby.address, this.ethc.address],
  //     );

  //     // Get supply after conversion
  //     const rubyTotalSupplyAfterConvert = await this.ruby.totalSupply();

  //     // Assert
  //     await assertRubyConversion(
  //       this,
  //       burnPercent,
  //       this.usdpRuby,
  //       rubyConvertedAmount,
  //       rubyTotalSupplyBeforeConvert,
  //       rubyTotalSupplyAfterConvert,
  //     );
  //     expect(await this.usdpEthc.balanceOf(this.rubyMaker.address)).to.equal(0);
  //   });

  // });

// });

  after(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
