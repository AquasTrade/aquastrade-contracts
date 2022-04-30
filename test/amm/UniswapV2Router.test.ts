import { expect } from "chai";

import { ethers, network } from "hardhat";
import { deployAMM, deployMockTokens, deployNFTAdmin, deployNftsAndNftAdmin, deployRubyFreeSwapNFT, deployRubyProfileNFT } from "../utilities/deployment";
import { addLiquidity } from "./utils";
describe("UniswapV2Router", function () {
  beforeEach(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];

    let {rubyFreeSwapNft, rubyProfileNft, nftAdmin} = await deployNftsAndNftAdmin(this.owner.address)

    this.rubyProfileNft = rubyProfileNft;
    this.rubyFreeSwapNft = rubyFreeSwapNft;
    this.nftAdmin = nftAdmin;

    await this.rubyFreeSwapNft.setMinter(this.owner.address, true);

    // AMM
    let { factory, ammRouter } = await deployAMM(this.owner.address, nftAdmin.address);
    this.factory = factory;
    this.router = ammRouter;
    
    await this.factory.setFeeDeductionSwapper(this.router.address, true);
  });

  it("UniswapV2Router should be deployed correctly", async function () {
    const factoryAddress = await this.factory.address;
    const routerFactoryAddress = await this.router.factory();

    expect(factoryAddress).to.be.eq(routerFactoryAddress);
  });

  it("Liquidity should not be added when the sender is not a pair creator", async function () {
    expect(await this.factory.pairCreators(this.owner.address)).to.be.eq(false);
    expect(await this.factory.pairCreators(this.router.address)).to.be.eq(false);

    let mockTokenSupply = ethers.utils.parseUnits("10000000000", 18);
    let token1Liquidity = ethers.utils.parseUnits("100000", 18);
    let token2Liquidity = ethers.utils.parseUnits("500000", 18);

    const mockTokens = await deployMockTokens(mockTokenSupply);

    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

    await expect(
      this.router.addLiquidity(
        mockTokens[0].address,
        mockTokens[1].address,
        token1Liquidity,
        token2Liquidity,
        token1Liquidity,
        token2Liquidity,
        this.owner.address,
        deadline,
      ),
    ).to.be.revertedWith("UniswapV2Router: PAIR_NOT_CREATED");
  });

  it("Liquidity should not be added when the AMM Router is not a pair creator", async function () {
    expect(await this.factory.pairCreators(this.owner.address)).to.be.eq(false);
    expect(await this.factory.pairCreators(this.router.address)).to.be.eq(false);

    await this.factory.setPairCreator(this.owner.address, true);

    expect(await this.factory.pairCreators(this.owner.address)).to.be.eq(true);
    expect(await this.factory.pairCreators(this.router.address)).to.be.eq(false);

    let mockTokenSupply = ethers.utils.parseUnits("10000000000", 18);
    let token1Liquidity = ethers.utils.parseUnits("100000", 18);
    let token2Liquidity = ethers.utils.parseUnits("500000", 18);

    const mockTokens = await deployMockTokens(mockTokenSupply);

    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

    await expect(
      this.router.addLiquidity(
        mockTokens[0].address,
        mockTokens[1].address,
        token1Liquidity,
        token2Liquidity,
        token1Liquidity,
        token2Liquidity,
        this.owner.address,
        deadline,
      ),
    ).to.be.revertedWith("UniswapV2: FORBIDDEN");
  });

  it("Liquidity should be added successfully when the sender is a pair creator", async function () {
    await addLiquidity(this.owner.address, this.router, this.factory)
  });

  it("Swap fee should be applied correctly on swapExactTokensForTokens", async function () {

    let {deadline, token1, token2} = await addLiquidity(this.owner.address, this.router, this.factory)

    const amount = ethers.utils.parseUnits("1000");
    const path = [token1.address, token2.address];
    const to = this.owner.address;

    expect(await this.rubyFreeSwapNft.balanceOf(this.owner.address)).to.be.eq(0);

    const balanceToken2Before = await token2.balanceOf(this.owner.address);

    expect(await this.rubyFreeSwapNft.balanceOf(this.owner.address)).to.be.eq(0);

    const amountsOutNoFee = (await this.router.getAmountsOut(amount, path, 1000))[1];
    const amountsOutWFee = (await this.router.getAmountsOut(amount, path, 997))[1];
    expect(amountsOutNoFee.sub(amountsOutWFee)).to.be.gt(ethers.utils.parseUnits("2.99", 18))

    await this.router.swapExactTokensForTokens(amount, ethers.constants.Zero, path, to, deadline);
    const balanceToken2After = await token2.balanceOf(this.owner.address);

    expect(balanceToken2After.sub(balanceToken2Before)).to.be.gt(ethers.utils.parseUnits("996.99"));

    await this.rubyFreeSwapNft.mint(this.owner.address);
    expect(await this.rubyFreeSwapNft.balanceOf(this.owner.address)).to.be.eq(1);

    await this.router.swapExactTokensForTokens(amount, ethers.constants.Zero, path, to, deadline);

    const balanceAfterNoFeeSwap2 = await token2.balanceOf(this.owner.address);
    expect(balanceAfterNoFeeSwap2.sub(balanceToken2After)).to.be.gt(ethers.utils.parseUnits("999.99"));

  });

  it("Swap fee should be applied correctly on swapTokensForExactTokens", async function () {

    let {deadline, token1, token2} = await addLiquidity(this.owner.address, this.router, this.factory)

    const amount = ethers.utils.parseUnits("1000");
    const path = [token1.address, token2.address];
    const to = this.owner.address;

    expect(await this.rubyFreeSwapNft.balanceOf(this.owner.address)).to.be.eq(0);

    const balanceToken1Before = await token1.balanceOf(this.owner.address);

    expect(await this.rubyFreeSwapNft.balanceOf(this.owner.address)).to.be.eq(0);

    let amountsInNoFee = (await this.router.getAmountsIn(amount, path, 1000))[0]
    const amountsInWFee = (await this.router.getAmountsIn(amount, path, 997))[0]

    expect(amountsInWFee.sub(amountsInNoFee)).to.be.gt(ethers.utils.parseUnits("3", 18))
    expect(amountsInWFee.sub(amountsInNoFee)).to.be.lt(ethers.utils.parseUnits("3.1", 18))

    await this.router.swapTokensForExactTokens(amount, amountsInWFee, path, to, deadline);
    const balanceToken1After = await token1.balanceOf(this.owner.address);

    expect(balanceToken1Before.sub(balanceToken1After)).to.be.gt(ethers.utils.parseUnits("1003"));
    expect(balanceToken1Before.sub(balanceToken1After)).to.be.lt(ethers.utils.parseUnits("1003.02"));

    await this.rubyFreeSwapNft.mint(this.owner.address);
    expect(await this.rubyFreeSwapNft.balanceOf(this.owner.address)).to.be.eq(1);

    amountsInNoFee = (await this.router.getAmountsIn(amount, path, 1000))[0]

    await this.router.swapTokensForExactTokens(amount, amountsInNoFee, path, to, deadline);

    const balanceAfterNoFeeSwap1 = await token1.balanceOf(this.owner.address);
    expect(balanceToken1After.sub(balanceAfterNoFeeSwap1)).to.be.gt(ethers.utils.parseUnits("1000"));
    expect(balanceToken1After.sub(balanceAfterNoFeeSwap1)).to.be.lt(ethers.utils.parseUnits("1000.01"));

  });


  this.afterEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
