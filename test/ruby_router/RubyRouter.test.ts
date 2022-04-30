import { expect } from "chai";

import { ethers, network } from "hardhat";
import { RubyRouter } from "../../typechain";
import {
  deployAMM,
  deployRubyRouter,
  deployMockTokens,
  deployRubyStablePool,
  deployStablePoolTokens,
  createMockLPs,
  deployNftsAndNftAdmin,
} from "../utilities/deployment";
import { addStablePoolLiquidity, approveTokens } from "../utilities/seeding";
import { SwapType, AMMSwapType } from "./types";
describe("RubyRouter", function () {
  beforeEach(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];

    // AMM  params
    this.mockTokenSupply = ethers.utils.parseUnits("10000000000", 18);
    this.token1liquidity = ethers.utils.parseUnits("100000", 18);
    this.token2liquidity = ethers.utils.parseUnits("500000", 18);
    this.token2liquidity6 = ethers.utils.parseUnits("500000", 6);

    let {rubyFreeSwapNft, rubyProfileNft, nftAdmin} = await deployNftsAndNftAdmin(this.owner.address)

    this.rubyProfileNft = rubyProfileNft;
    this.rubyFreeSwapNft = rubyFreeSwapNft;
    this.nftAdmin = nftAdmin;


    await rubyProfileNft.setMinter(nftAdmin.address, true);

    // AMM
    let { factory, ammRouter } = await deployAMM(this.owner.address, nftAdmin.address);
    this.factory = factory;
    this.ammRouter = ammRouter;

    await this.factory.setPairCreator(this.owner.address, true);
    await this.factory.setPairCreator(this.ammRouter.address, true);

    this.mockTokens = await deployMockTokens(this.mockTokenSupply);
    await approveTokens(this.mockTokens, this.ammRouter.address, ethers.constants.MaxUint256);

    await createMockLPs(
      this.ammRouter,
      this.mockTokens,
      this.token1liquidity,
      this.token2liquidity,
      this.owner.address,
    );

    // StableSwap  params
    this.liquidityStableToken18 = ethers.utils.parseUnits("1000000", 18);
    this.liquidityStableToken6 = ethers.utils.parseUnits("1000000", 6);

    const { dai, usdp, usdc, usdt } = await deployStablePoolTokens();
    this.dai = dai;
    this.usdp = usdp;
    this.usdc = usdc;
    this.usdt = usdt;

    let stableTokens = [this.dai, this.usdp, this.usdc, this.usdt];
    this.rubyStablePool = await deployRubyStablePool(stableTokens);

    await addStablePoolLiquidity(this.rubyStablePool, stableTokens, [
      this.liquidityStableToken18,
      this.liquidityStableToken18,
      this.liquidityStableToken6,
      this.liquidityStableToken6,
    ]);

    await approveTokens(stableTokens, this.ammRouter.address, ethers.constants.MaxUint256);
    await createMockLPs(
      this.ammRouter,
      [this.mockTokens[0], this.dai, this.mockTokens[1], this.usdp],
      this.token1liquidity,
      this.token2liquidity,
      this.owner.address,
    );
    await createMockLPs(
      this.ammRouter,
      [this.mockTokens[2], this.usdc, this.mockTokens[3], this.usdt],
      this.token1liquidity,
      this.token2liquidity6,
      this.owner.address,
    );

    this.rubyRouter = <RubyRouter>await deployRubyRouter(this.owner.address, this.ammRouter.address, this.rubyStablePool.address, this.nftAdmin.address, 3);

    await nftAdmin.setMinter(this.rubyRouter.address, true);
  });

  it("RubyRouter should be deployed correctly", async function () {
    const ammRouterAddr = await this.rubyRouter.ammRouter();
    const stablePoolEnabled = await this.rubyRouter.enabledStablePools(this.rubyStablePool.address);

    expect(ammRouterAddr).to.be.eq(this.ammRouter.address);
    expect(stablePoolEnabled).to.be.eq(true);
  });

  it("Routing should work as expected starting from the AMM", async function () {
    const tokenIn = this.mockTokens[0];
    const stableTokenIn = this.dai;
    const stableTokenOut = this.usdp;

    const tokenInAmount = ethers.utils.parseUnits("100", 18);
    const feeMultiplier = await this.nftAdmin.calculateAmmSwapFeeDeduction(this.owner.address);

    const amountsOut = await this.ammRouter.getAmountsOut(tokenInAmount, [tokenIn.address, stableTokenIn.address], feeMultiplier);
    const stableTokenInAmount = amountsOut[amountsOut.length - 1];

    const stableTokenInIndex = await this.rubyStablePool.getTokenIndex(stableTokenIn.address);
    const stableTokenOutIndex = await this.rubyStablePool.getTokenIndex(stableTokenOut.address);

    const stableTokenOutAmount = await this.rubyStablePool.calculateSwap(
      stableTokenInIndex,
      stableTokenOutIndex,
      stableTokenInAmount,
    );

    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

    const swapDetails = {
      ammSwaps: [
        {
          swapType: AMMSwapType.EXACT_TOKENS_FOR_TOKENS,
          amountIn: tokenInAmount,
          amountOut: stableTokenInAmount,
          path: [tokenIn.address, stableTokenIn.address],
          to: this.rubyRouter.address,
          deadline: deadline,
        },
      ],
      stableSwaps: [
        {
          stablePool: this.rubyStablePool.address,
          tokenIndexFrom: stableTokenInIndex,
          tokenIndexTo: stableTokenOutIndex,
          dx: stableTokenInAmount,
          minDy: stableTokenOutAmount,
          deadline: deadline,
        },
      ],
      order: [SwapType.AMM, SwapType.STABLE_POOL],
    };

    await approveTokens([tokenIn], this.rubyRouter.address, tokenInAmount);

    expect(await tokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await stableTokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await stableTokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);

    const tokenInBalanceBefore = await tokenIn.balanceOf(this.owner.address);
    const stableTokenInBalanceBefore = await stableTokenIn.balanceOf(this.owner.address);
    const stableTokenOutBalanceBefore = await stableTokenOut.balanceOf(this.owner.address);

    const stableSwapTokenInBalanceBefore = await this.rubyStablePool.getTokenBalance(stableTokenInIndex);
    const stableSwapTokenOutBalanceBefore = await this.rubyStablePool.getTokenBalance(stableTokenOutIndex);

    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(0);

    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(0);
    const tx = await this.rubyRouter.swap(swapDetails);
    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(1);

    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(1);
    expect(await tokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await stableTokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await stableTokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);



    expect(await tokenIn.balanceOf(this.owner.address)).to.be.eq(tokenInBalanceBefore.sub(tokenInAmount));
    expect(await stableTokenOut.balanceOf(this.owner.address)).to.be.eq(
      stableTokenOutBalanceBefore.add(stableTokenOutAmount),
    );
    expect(await stableTokenIn.balanceOf(this.owner.address)).to.be.eq(stableTokenInBalanceBefore);

    expect(await this.rubyStablePool.getTokenBalance(stableTokenInIndex)).to.be.eq(
      stableSwapTokenInBalanceBefore.add(stableTokenInAmount),
    );
    expect(await this.rubyStablePool.getTokenBalance(stableTokenOutIndex)).to.be.eq(
      stableSwapTokenOutBalanceBefore.sub(stableTokenOutAmount),
    );

    await tx.wait(1);
  });

  it("Routing should work as expected starting from the StablePool", async function () {
    const stableTokenIn = this.dai;
    const stableTokenOut = this.usdp;
    const tokenOut = this.mockTokens[1];

    const stableTokenInAmount = ethers.utils.parseUnits("100", 18);

    const stableTokenInIndex = await this.rubyStablePool.getTokenIndex(stableTokenIn.address);
    const stableTokenOutIndex = await this.rubyStablePool.getTokenIndex(stableTokenOut.address);

    const stableTokenOutAmount = await this.rubyStablePool.calculateSwap(
      stableTokenInIndex,
      stableTokenOutIndex,
      stableTokenInAmount,
    );

    const feeMultiplier = await this.nftAdmin.calculateAmmSwapFeeDeduction(this.owner.address);

    const amountsOut = await this.ammRouter.getAmountsOut(stableTokenOutAmount, [
      stableTokenOut.address,
      tokenOut.address
    ], feeMultiplier);
    const tokenOutAmount = amountsOut[amountsOut.length - 1];

    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

    const swapDetails = {
      ammSwaps: [
        {
          swapType: AMMSwapType.EXACT_TOKENS_FOR_TOKENS,
          amountIn: stableTokenOutAmount,
          amountOut: tokenOutAmount,
          path: [stableTokenOut.address, tokenOut.address],
          to: this.rubyRouter.address,
          deadline: deadline,
        },
      ],
      stableSwaps: [
        {
          stablePool: this.rubyStablePool.address,
          tokenIndexFrom: stableTokenInIndex,
          tokenIndexTo: stableTokenOutIndex,
          dx: stableTokenInAmount,
          minDy: stableTokenOutAmount,
          deadline: deadline,
        },
      ],
      order: [SwapType.STABLE_POOL, SwapType.AMM],
    };

    await approveTokens([stableTokenIn], this.rubyRouter.address, stableTokenInAmount);

    expect(await tokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await stableTokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await stableTokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);

    const tokenOutBalanceBefore = await tokenOut.balanceOf(this.owner.address);
    const stableTokenInBalanceBefore = await stableTokenIn.balanceOf(this.owner.address);
    const stableTokenOutBalanceBefore = await stableTokenOut.balanceOf(this.owner.address);

    const stableSwapTokenInBalanceBefore = await this.rubyStablePool.getTokenBalance(stableTokenInIndex);
    const stableSwapTokenOutBalanceBefore = await this.rubyStablePool.getTokenBalance(stableTokenOutIndex);

    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(0);
    const tx = await this.rubyRouter.swap(swapDetails);
    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(1);


    expect(await tokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await stableTokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await stableTokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);

    expect(await tokenOut.balanceOf(this.owner.address)).to.be.eq(tokenOutBalanceBefore.add(tokenOutAmount));
    expect(await stableTokenOut.balanceOf(this.owner.address)).to.be.eq(stableTokenOutBalanceBefore);
    expect(await stableTokenIn.balanceOf(this.owner.address)).to.be.eq(
      stableTokenInBalanceBefore.sub(stableTokenInAmount),
    );

    expect(await this.rubyStablePool.getTokenBalance(stableTokenInIndex)).to.be.eq(
      stableSwapTokenInBalanceBefore.add(stableTokenInAmount),
    );
    expect(await this.rubyStablePool.getTokenBalance(stableTokenOutIndex)).to.be.eq(
      stableSwapTokenOutBalanceBefore.sub(stableTokenOutAmount),
    );

    await tx.wait(1);
  });

  it("Exact tokens for tokens AMM routing only should work as expected", async function () {
    const tokenIn = this.mockTokens[0];
    const tokenOut = this.mockTokens[1];

    const tokenInAmount = ethers.utils.parseUnits("100", 18);
    const feeMultiplier = await this.nftAdmin.calculateAmmSwapFeeDeduction(this.owner.address);

    const amountsOut = await this.ammRouter.getAmountsOut(tokenInAmount, [tokenIn.address, tokenOut.address], feeMultiplier);
    const tokenOutAmount = amountsOut[amountsOut.length - 1];

    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

    const swapDetails = {
      ammSwaps: [
        {
          swapType: AMMSwapType.EXACT_TOKENS_FOR_TOKENS,
          amountIn: tokenInAmount,
          amountOut: tokenOutAmount,
          path: [tokenIn.address, tokenOut.address],
          to: this.rubyRouter.address,
          deadline: deadline,
        },
      ],
      stableSwaps: [],
      order: [SwapType.AMM],
    };

    await approveTokens([tokenIn], this.rubyRouter.address, tokenInAmount);

    expect(await tokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await tokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);

    const tokenInBalanceBefore = await tokenIn.balanceOf(this.owner.address);
    const tokenOutBalanceBefore = await tokenOut.balanceOf(this.owner.address);

    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(0);

    const tx = await this.rubyRouter.swap(swapDetails);

    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(1);


    expect(await tokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await tokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);

    expect(await tokenIn.balanceOf(this.owner.address)).to.be.eq(tokenInBalanceBefore.sub(tokenInAmount));
    expect(await tokenOut.balanceOf(this.owner.address)).to.be.eq(tokenOutBalanceBefore.add(tokenOutAmount));

    await tx.wait(1);
  });

  it("Tokens for exact tokens AMM routing only should work as expected", async function () {
    const tokenIn = this.mockTokens[0];
    const tokenOut = this.mockTokens[1];

    const tokenOutAmount = ethers.utils.parseUnits("100", 18);
    const feeMultiplier = await this.nftAdmin.calculateAmmSwapFeeDeduction(this.owner.address);

    const amountsIn = await this.ammRouter.getAmountsIn(tokenOutAmount, [tokenIn.address, tokenOut.address], feeMultiplier);
    const tokenInAmount = amountsIn[0];

    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

    const swapDetails = {
      ammSwaps: [
        {
          swapType: AMMSwapType.TOKENS_FOR_EXACT_TOKENS,
          amountIn: tokenInAmount,
          amountOut: tokenOutAmount,
          path: [tokenIn.address, tokenOut.address],
          to: this.rubyRouter.address,
          deadline: deadline,
        },
      ],
      stableSwaps: [],
      order: [SwapType.AMM],
    };

    await approveTokens([tokenIn], this.rubyRouter.address, tokenInAmount);

    expect(await tokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await tokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);

    const tokenInBalanceBefore = await tokenIn.balanceOf(this.owner.address);
    const tokenOutBalanceBefore = await tokenOut.balanceOf(this.owner.address);

    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(0);
    const tx = await this.rubyRouter.swap(swapDetails);
    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(1);


    expect(await tokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await tokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);

    expect(await tokenIn.balanceOf(this.owner.address)).to.be.eq(tokenInBalanceBefore.sub(tokenInAmount));
    expect(await tokenOut.balanceOf(this.owner.address)).to.be.eq(tokenOutBalanceBefore.add(tokenOutAmount));

    await tx.wait(1);
  });

  it("StablePool routing only should work as expected", async function () {
    const stableTokenIn = this.dai;
    const stableTokenOut = this.usdp;

    const stableTokenInAmount = ethers.utils.parseUnits("100", 18);

    const stableTokenInIndex = await this.rubyStablePool.getTokenIndex(stableTokenIn.address);
    const stableTokenOutIndex = await this.rubyStablePool.getTokenIndex(stableTokenOut.address);

    const stableTokenOutAmount = await this.rubyStablePool.calculateSwap(
      stableTokenInIndex,
      stableTokenOutIndex,
      stableTokenInAmount,
    );

    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

    const swapDetails = {
      ammSwaps: [],
      stableSwaps: [
        {
          stablePool: this.rubyStablePool.address,
          tokenIndexFrom: stableTokenInIndex,
          tokenIndexTo: stableTokenOutIndex,
          dx: stableTokenInAmount,
          minDy: stableTokenOutAmount,
          deadline: deadline,
        },
      ],
      order: [SwapType.STABLE_POOL],
    };

    await approveTokens([stableTokenIn], this.rubyRouter.address, stableTokenInAmount);

    expect(await stableTokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await stableTokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);

    const stableSwapTokenInBalanceBefore = await this.rubyStablePool.getTokenBalance(stableTokenInIndex);
    const stableSwapTokenOutBalanceBefore = await this.rubyStablePool.getTokenBalance(stableTokenOutIndex);

    const stableTokenInBalanceBefore = await stableTokenIn.balanceOf(this.owner.address);
    const stableTokenOutBalanceBefore = await stableTokenOut.balanceOf(this.owner.address);

    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(0);
    const tx = await this.rubyRouter.swap(swapDetails);
    expect(await this.rubyProfileNft.balanceOf(this.owner.address)).to.be.eq(1);


    expect(await stableTokenIn.balanceOf(this.rubyRouter.address)).to.be.eq(0);
    expect(await stableTokenOut.balanceOf(this.rubyRouter.address)).to.be.eq(0);

    expect(await stableTokenIn.balanceOf(this.owner.address)).to.be.eq(
      stableTokenInBalanceBefore.sub(stableTokenInAmount),
    );
    expect(await stableTokenOut.balanceOf(this.owner.address)).to.be.eq(
      stableTokenOutBalanceBefore.add(stableTokenOutAmount),
    );

    expect(await this.rubyStablePool.getTokenBalance(stableTokenInIndex)).to.be.eq(
      stableSwapTokenInBalanceBefore.add(stableTokenInAmount),
    );
    expect(await this.rubyStablePool.getTokenBalance(stableTokenOutIndex)).to.be.eq(
      stableSwapTokenOutBalanceBefore.sub(stableTokenOutAmount),
    );

    await tx.wait(1);
  });

  it("AMM router should be set correctly", async function () {
    expect(await this.rubyRouter.setAmmRouter(this.ammRouter.address))
    .to.emit(this.rubyRouter, "AmmRouterSet")
    .withArgs(this.ammRouter.address);

    let ammRouterAddr = await this.rubyRouter.ammRouter();
    expect(ammRouterAddr).to.be.eq(this.ammRouter.address);
  });

  it("NFT admin should be set correctly", async function () {
    expect(await this.rubyRouter.setNftAdmin(this.nftAdmin.address))
    .to.emit(this.rubyRouter, "NftAdminSet")
    .withArgs(this.nftAdmin.address);

    let nftAdminAddr = await this.rubyRouter.nftAdmin();
    expect(nftAdminAddr).to.be.eq(this.nftAdmin.address);
  });

  it("Max hops param should be set correctly", async function () {
    expect(await this.rubyRouter.setMaxHops(5))
    .to.emit(this.rubyRouter, "MaxHopsSet")
    .withArgs(5);
  });

  it("StablePool should be disabled correctly", async function () {
    expect(await this.rubyRouter.disableStablePool(this.rubyStablePool.address))
    .to.emit(this.rubyRouter, "StablePoolDisabled")
    .withArgs(this.rubyStablePool.address);

    let stablePoolStatus = await this.rubyRouter.enabledStablePools(this.rubyStablePool.address);
    expect(stablePoolStatus).to.be.eq(false);

  });

  it("StablePool should be enabled correctly", async function () {
    expect(await this.rubyRouter.enableStablePool(this.rubyStablePool.address))
    .to.emit(this.rubyRouter, "StablePoolEnabled")
    .withArgs(this.rubyStablePool.address);

    let stablePoolStatus = await this.rubyRouter.enabledStablePools(this.rubyStablePool.address);
    expect(stablePoolStatus).to.be.eq(true);
  });


  afterEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
