const { ethers, upgrades } = require("hardhat");
import { BigNumber } from "ethers";
import {
  UniswapV2Router02,
  UniswapV2Pair,
  UniswapV2Factory,
  MockERC20,
  MockUSDT,
  MockUSDC,
  MockUSDP,
  MockDAI,
  SwapUtils,
  AmplificationUtils,
  SwapDeployer,
  Swap,
  LPToken,
  ERC20,
  AquasRouter,
  NFTAdmin,
  ProfileNFT,
  RubyFreeSwapNFT,
  RubyMaker,
  RubyStaker
} from "../../../typechain";


export const deployRubyFreeSwapNFT = async (owner: string, name: string, symbol: string, description: string, visualAppearance: string) => {
  let RubyFreeSwap = await ethers.getContractFactory("RubyFreeSwapNFT");

  let rubyFreeSwapNFT: RubyFreeSwapNFT = await upgrades.deployProxy(RubyFreeSwap, [owner, name, symbol, description, visualAppearance]);
  await rubyFreeSwapNFT.deployed();

  return rubyFreeSwapNFT;
}

export const deployProfileNFT = async (owner: string, name: string, symbol: string, description: string, visualAppearance: string) => {
  let RubyProfile = await ethers.getContractFactory("ProfileNFT");

  let rubyProfileNFT: ProfileNFT = await upgrades.deployProxy(RubyProfile, [owner, name, symbol, description, visualAppearance]);
  await rubyProfileNFT.deployed();

  return rubyProfileNFT;
}


export const deployNFTAdmin = async (owner: string, rubyProfileNFT: string, rubyFreeSwapNFT: string) => {
  let NFTAdmin = await ethers.getContractFactory("NFTAdmin");

  let nftAdmin: NFTAdmin = await upgrades.deployProxy(NFTAdmin, [owner, rubyProfileNFT, rubyFreeSwapNFT])
  await nftAdmin.deployed();

  return nftAdmin;
}

export const deployAMM = async (admin: string, nftAdmin: string) => {
  let UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
  let UniswapV2Router = await ethers.getContractFactory("UniswapV2Router02");

  let factory: UniswapV2Factory = await UniswapV2Factory.deploy(admin);
  await factory.deployed();

  let ammRouter: UniswapV2Router02 = await upgrades.deployProxy(UniswapV2Router, [admin, factory.address, nftAdmin]) 
  await ammRouter.deployed()

  return {
    factory,
    ammRouter,
  };
};

export const deployMockTokens = async (tokenSupply: BigNumber): Promise<Array<MockERC20>> => {
  let MockERC20 = await ethers.getContractFactory("MockERC20");

  let mockTokens = [];
  for (let i = 0; i < 10; i++) {
    let mockToken: MockERC20 = await MockERC20.deploy(`Mock token ${i}`, `MTK${i}`, tokenSupply, 18);
    await mockToken.deployed();
    mockTokens.push(mockToken);
  }

  return mockTokens;
};


export const createMockLPs = async (
  ammRouter: UniswapV2Router02,
  mockTokens: Array<MockERC20>,
  token1Liquidity: BigNumber,
  token2Liquidity: BigNumber,
  to: string,
) => {
  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  for (let i = 0; i < mockTokens.length; i += 2) {
    const res = await ammRouter.addLiquidity(
      mockTokens[i].address,
      mockTokens[i + 1].address,
      token1Liquidity,
      token2Liquidity,
      token1Liquidity,
      token2Liquidity,
      to,
      deadline,
    );
    await res.wait(1);
  }
};

export const deployStablePoolTokens = async () => {
  let MockDAI = await ethers.getContractFactory("MockDAI");
  let MockUSDP = await ethers.getContractFactory("MockUSDP");
  let MockUSDC = await ethers.getContractFactory("MockUSDC");
  let MockUSDT = await ethers.getContractFactory("MockUSDT");

  let dai: MockDAI = await MockDAI.deploy();
  await dai.deployed();
  let usdp: MockUSDP = await MockUSDP.deploy();
  await usdp.deployed();
  let usdc: MockUSDC = await MockUSDC.deploy();
  await usdc.deployed();
  let usdt: MockUSDT = await MockUSDT.deploy();
  await usdt.deployed();

  return {
    dai,
    usdp,
    usdc,
    usdt,
  };
};

export const deployRubyStablePool = async (tokens: Array<MockERC20>): Promise<Swap> => {
  let SwapUtils = await ethers.getContractFactory("SwapUtils");
  let AmplificationUtils = await ethers.getContractFactory("AmplificationUtils");
  let SwapDeployer = await ethers.getContractFactory("SwapDeployer");
  let LPToken = await ethers.getContractFactory("LPToken");

  let swapUtils: SwapUtils = await SwapUtils.deploy();
  await swapUtils.deployed();

  let amplificationUtils: AmplificationUtils = await AmplificationUtils.deploy();
  await amplificationUtils.deployed();

  let swapDeployer: SwapDeployer = await SwapDeployer.deploy();
  await swapDeployer.deployed();

  let Swap = await ethers.getContractFactory("Swap", {
    libraries: {
      SwapUtils: swapUtils.address,
      AmplificationUtils: amplificationUtils.address,
    },
  });

  let swap: Swap = await Swap.deploy();
  await swap.deployed();

  let lpToken: LPToken = await LPToken.deploy();
  await lpToken.deployed();

  const initTx = await lpToken.initialize("Ruby LP Token (Target)", "rubyLPTokenTarget");
  await initTx.wait(1);

  const TOKEN_DECIMALS = await Promise.all(tokens.map(async token => await token.decimals()));
  const LP_TOKEN_NAME = "Ruby USDP/DAI/USDC/USDT";
  const LP_TOKEN_SYMBOL = "rubyUSD";
  const INITIAL_A = 200;
  const SWAP_FEE = 4e6; // 4bps
  const ADMIN_FEE = 0;
  const TOKEN_ADDRESSES = tokens.map(token => token.address);

  const poolInitTx = await swapDeployer.deploy(
    swap.address,
    TOKEN_ADDRESSES,
    TOKEN_DECIMALS,
    LP_TOKEN_NAME,
    LP_TOKEN_SYMBOL,
    INITIAL_A,
    SWAP_FEE,
    ADMIN_FEE,
    lpToken.address,
  );
  const receipt = await poolInitTx.wait(1);

  const poolAddress = (<any>receipt).events[3].args.swapAddress;
  let rubyStablePool: Swap = await ethers.getContractAt("Swap", poolAddress);

  return rubyStablePool;
};


export const deployAquasRouter = async (
  owner: string,
  ammRouter: string,
  stablePool: string,
  nftAdmin: string,
  maxHops: number,
): Promise<AquasRouter> => {
  let Router = await ethers.getContractFactory("AquasRouter");
  let rubyRouter: AquasRouter = await upgrades.deployProxy(Router, [owner, ammRouter, stablePool, nftAdmin, maxHops])

  await rubyRouter.deployed()

  return rubyRouter;
};


export const deployRubyMaker = async (owner: string, factory: string, staker: string, ruby: string, usdToken: string, burnPercent: number): Promise<RubyMaker> => {

  let RubyMaker = await ethers.getContractFactory("RubyMaker");
  const rubyMaker: RubyMaker = await upgrades.deployProxy(RubyMaker, [owner, factory, staker, ruby, usdToken, burnPercent]);
  await rubyMaker.deployed();
  return rubyMaker;

}


export const deployRubyStaker = async (owner: string, ruby: string, maxNumRewards: number): Promise<RubyStaker> => {

  let RubyStaker = await ethers.getContractFactory("RubyStaker");
  const rubyStaker: RubyStaker = await upgrades.deployProxy(RubyStaker, [owner, ruby, maxNumRewards]);
  await rubyStaker.deployed();
  return rubyStaker;

}


export const deployNftsAndNftAdmin = async (ownerAddress: string) => {

  const description = JSON.stringify({
    "description": "swap fees",
    "feeReduction": 1000, 
    "lpFeeDeduction": 3,
    "randomMetadata": {}
  });

  const visualAppearance = JSON.stringify({
    "att1": 1,
    "att2": 2, 
    "att3": 3,
  });


  let rubyFreeSwapNft = await deployRubyFreeSwapNFT(ownerAddress, "Ruby Free Swap NFT", "RFSNFT", description, visualAppearance)
  let rubyProfileNft = await deployProfileNFT(ownerAddress, "Ruby Profile NFT", "RPNFT", description, visualAppearance)
  let nftAdmin = await deployNFTAdmin(ownerAddress, rubyProfileNft.address, rubyFreeSwapNft.address);

  return {
    rubyFreeSwapNft,
    rubyProfileNft,
    nftAdmin
  }

}


export const deployRubyNFT = async (ownerAddress: string, name: string, symbol: string, details: string, visualAppearance: string) => {
    
  let RubyNFT = await ethers.getContractFactory("RubyNFT");

  let rubyNft: ProfileNFT = await upgrades.deployProxy(RubyNFT, [ownerAddress, name, symbol, details, visualAppearance]);
  await rubyNft.deployed();

  return rubyNft;

}