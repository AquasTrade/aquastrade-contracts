const { ethers, network, deployments } = require("hardhat");
import { BigNumber } from "ethers";
import { getHeapStatistics } from "v8";
import { UniswapV2Router02, UniswapV2Pair, UniswapV2Factory, MockERC20, MockUSDT, MockUSDC, MockUSDP, MockDAI, SwapUtils, AmplificationUtils, SwapDeployer, Swap, LPToken, ERC20, RubyRouter} from "../../typechain"

export const deployAMM = async (feeToSetter: string) => {

    let UniswapV2Factory  = await ethers.getContractFactory("UniswapV2Factory");
    let UniswapV2Router  = await ethers.getContractFactory("UniswapV2Router02");

    let factory: UniswapV2Factory = await UniswapV2Factory.deploy(feeToSetter);
    await factory.deployed();
    
    let ammRouter: UniswapV2Router02 = await UniswapV2Router.deploy(factory.address);
    await ammRouter.deployed();

    return {
        factory,
        ammRouter
    }

}

export const deployMockTokens = async (tokenSupply: BigNumber): Promise<Array<MockERC20>> => {

    let MockERC20 = await ethers.getContractFactory("MockERC20");

    let mockTokens = [];
    for (let i = 0; i < 10; i++) {
        let mockToken: MockERC20 = await MockERC20.deploy(`Mock token ${i}`, `MTK${i}`, tokenSupply, 18 );
        await mockToken.deployed();
        mockTokens.push(mockToken);
    }

    return mockTokens;
}


export const approveTokens = async (mockTokens: Array<MockERC20>,  spender: string, amount: BigNumber) => {

    for(let i = 0; i < mockTokens.length; i++) {
        let tx = await mockTokens[i].approve(spender, amount);
        await tx.wait(1);
    }



};

export const createMockLPs = async (ammRouter: UniswapV2Router02,  mockTokens: Array<MockERC20>, token1Liquidity: BigNumber, token2Liquidity: BigNumber, to: string) => {
    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

    for(let i = 0; i < mockTokens.length; i+=2) {
        const res = await ammRouter.addLiquidity(mockTokens[i].address, mockTokens[i+1].address, token1Liquidity, token2Liquidity, token1Liquidity, token2Liquidity, to, deadline);
        await res.wait(1);
    }

}

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
        usdt
    }

}

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
    

    let Swap = await ethers.getContractFactory("Swap",  {libraries: {
        "SwapUtils": swapUtils.address,
        "AmplificationUtils": amplificationUtils.address,
    }});

    let swap: Swap = await Swap.deploy();
    await swap.deployed();

    let lpToken: LPToken = await LPToken.deploy();
    await lpToken.deployed();

    const initTx = await lpToken.initialize("Ruby LP Token (Target)", "rubyLPTokenTarget");
    await initTx.wait(1);

    const TOKEN_DECIMALS = await Promise.all(tokens.map(async token => (await token.decimals())))
    const LP_TOKEN_NAME = "Ruby USDP/DAI/USDC/USDT";
    const LP_TOKEN_SYMBOL = "rubyUSD";
    const INITIAL_A = 200;
    const SWAP_FEE = 4e6; // 4bps
    const ADMIN_FEE = 0;
    const TOKEN_ADDRESSES = tokens.map(token => token.address);


    const poolInitTx = await swapDeployer.deploy(swap.address, TOKEN_ADDRESSES, TOKEN_DECIMALS, LP_TOKEN_NAME, LP_TOKEN_SYMBOL, INITIAL_A, SWAP_FEE, ADMIN_FEE, lpToken.address);
    const receipt = await poolInitTx.wait(1);
    
    const poolAddress = (<any>receipt).events[3].args.swapAddress;
    let rubyStablePool: Swap = await ethers.getContractAt("Swap", poolAddress); 

    return rubyStablePool;

}

export const addStablePoolLiquidity = async (rubyStablePool: Swap, tokens: Array<ERC20>, liquidityAmounts: Array<BigNumber>) => {

    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

    for (let i = 0; i < tokens.length; i++) {
        const tx = await tokens[i].approve(rubyStablePool.address, liquidityAmounts[i]);
        await tx.wait(1);
    }

    const tx = await rubyStablePool.addLiquidity(liquidityAmounts, 0, deadline);
    await tx.wait(1);

}

export const deployRubyRouter = async (ammRouterAddress: string, stablePoolAddress: string, maxHops: number): Promise<RubyRouter> => {

    let RubyRouter = await ethers.getContractFactory("RubyRouter")
    let rubyRouter: RubyRouter = await RubyRouter.deploy();
    let tx = await rubyRouter.initialize(ammRouterAddress, stablePoolAddress, maxHops);
    await tx.wait(1);

    return rubyRouter;
}