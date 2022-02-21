import { expect } from "chai";

import { ethers, network } from "hardhat";
import { deployAMM, deployMockTokens, approveTokens } from "../utilities/deployment";
describe("UniswapV2Router", function () {
  beforeEach(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];

    // AMM
    let { factory, ammRouter } = await deployAMM(this.owner.address);
    this.factory = factory;
    this.router = ammRouter;
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

    await this.factory.setPairCreator(this.owner.address);

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
    expect(await this.factory.pairCreators(this.owner.address)).to.be.eq(false);
    expect(await this.factory.pairCreators(this.router.address)).to.be.eq(false);

    await this.factory.setPairCreator(this.owner.address);
    await this.factory.setPairCreator(this.router.address);

    expect(await this.factory.pairCreators(this.owner.address)).to.be.eq(true);
    expect(await this.factory.pairCreators(this.router.address)).to.be.eq(true);

    let mockTokenSupply = ethers.utils.parseUnits("10000000000", 18);
    let token1Liquidity = ethers.utils.parseUnits("100000", 18);
    let token2Liquidity = ethers.utils.parseUnits("500000", 18);

    const mockTokens = await deployMockTokens(mockTokenSupply);

    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

    await approveTokens([mockTokens[0], mockTokens[1]], this.router.address, ethers.constants.MaxUint256);

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
    ).to.emit(this.factory, "PairCreated");
  });

  this.afterEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
