import { ethers,  network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { BigNumber } from "ethers";

// Intentionally use deployed jsons rather than ethers/hardhat-deploy/typescript primitives
// so that this code can be more easily shared

import ERC20_ABI from "../../abi/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

const RUBY_ROUTER_ADDR = require(`../../deployments/${network.name}/RubyRouter.json`).address;
const UNI_ROUTER_ADDR = require(`../../deployments/${network.name}/UniswapV2Router02.json`).address;
const NFT_ADMIN_ADDR = require(`../../deployments/${network.name}/RubyNFTAdmin.json`).address;
const STABLE_SWAP_ADDR = require(`../../deployments/${network.name}/RubyUSD4Pool.json`).address;

const USDP_ADDR = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
const USDT_ADDR = require(`../../deployments/${network.name}/RubyUSDT.json`).address;
const ETHC_ADDR = "0xD2Aaa00700000000000000000000000000000000";

const RUBY_ROUTER_ABI = require(`../../deployments/${network.name}/RubyRouter.json`).abi;
const UNI_ROUTER_ABI = require(`../../deployments/${network.name}/UniswapV2Router02.json`).abi;
const NFT_ADMIN_ABI = require(`../../deployments/${network.name}/RubyNFTAdmin.json`).abi;
const STABLE_SWAP_ABI = require(`../../deployments/${network.name}/RubyUSD4Pool.json`).abi;


enum SwapType {
    AMM,
    STABLE_POOL,
};
  
enum AMMSwapType {
    EXACT_TOKENS_FOR_TOKENS,
    TOKENS_FOR_EXACT_TOKENS,
};


const approveERC20 = async (token: any, spenderAddr: string, amount: BigNumber) => {
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    
    console.log(`Aproving ${spenderAddr} to spend ${ethers.utils.formatUnits(amount, decimals)}${symbol}`);
    const res = await token.approve(spenderAddr, amount);
    await res.wait(1);

    console.log("...approved");
};


const swapERC20ToUSDT = async (dryRun: boolean, erc20Addr: string, amountStr: string, signer: SignerWithAddress) => {
    const account = signer;

    let symbol;
    let decimals;
    let balance;

    const tokenIn = new ethers.Contract(erc20Addr, ERC20_ABI, account);  // with signer for approval

    symbol = await tokenIn.symbol();
    decimals = await tokenIn.decimals();
    balance = await tokenIn.balanceOf(account.address);

    const tokenInAmount = ethers.utils.parseUnits(amountStr, decimals);

    console.log(`Current ${amountStr}${symbol} -> USDT (Starting ${symbol} balance: ${ethers.utils.formatUnits(balance, decimals)})`);

    const stableTokenIn = new ethers.Contract(USDP_ADDR, ERC20_ABI, ethers.provider);
    const stableTokenOut = new ethers.Contract(USDT_ADDR, ERC20_ABI, ethers.provider);

    const nftAdmin = new ethers.Contract(NFT_ADMIN_ADDR, NFT_ADMIN_ABI, ethers.provider);
    const ammRouter = new ethers.Contract(UNI_ROUTER_ADDR, UNI_ROUTER_ABI, ethers.provider);
    const rubyStablePool = new ethers.Contract(STABLE_SWAP_ADDR, STABLE_SWAP_ABI, ethers.provider);

    const rubyRouter = new ethers.Contract(RUBY_ROUTER_ADDR, RUBY_ROUTER_ABI, account);

    const feeMultiplier = await nftAdmin.calculateAmmSwapFeeDeduction(account.address);
    const amountsOut = await ammRouter.getAmountsOut(tokenInAmount, [tokenIn.address, stableTokenIn.address], feeMultiplier);
    const stableTokenInAmount = amountsOut[amountsOut.length - 1];

    const stableTokenInIndex = await rubyStablePool.getTokenIndex(stableTokenIn.address);  // USDP
    const stableTokenOutIndex = await rubyStablePool.getTokenIndex(stableTokenOut.address);  // USDT

    const stableTokenOutAmount = await rubyStablePool.calculateSwap(
      stableTokenInIndex,
      stableTokenOutIndex,
      stableTokenInAmount,
    );

    symbol = await stableTokenOut.symbol();
    decimals = await stableTokenOut.decimals();
    balance = await stableTokenOut.balanceOf(account.address);
    console.log(`Should recieve ${ethers.utils.formatUnits(stableTokenOutAmount, decimals)}${symbol} (Current ${symbol} balance: ${ethers.utils.formatUnits(balance, decimals)})`)

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
          to: rubyRouter.address,
          deadline: deadline,
        },
      ],
      stableSwaps: [
        {
          stablePool: rubyStablePool.address,
          tokenIndexFrom: stableTokenInIndex,
          tokenIndexTo: stableTokenOutIndex,
          dx: stableTokenInAmount,
          minDy: stableTokenOutAmount,
          deadline: deadline,
        },
      ],
      order: [SwapType.AMM, SwapType.STABLE_POOL],
    };

    await approveERC20(tokenIn, rubyRouter.address, tokenInAmount);

    if (dryRun) {
        console.log("Not swapping (dry run)")
    } else {
        console.log("Swapping")
        const tx = await rubyRouter.swap(swapDetails);
        console.log("...swapped")
    }

    symbol = await tokenIn.symbol();
    decimals = await tokenIn.decimals();
    balance = await tokenIn.balanceOf(account.address);
    console.log(`Final ${symbol} balance: ${ethers.utils.formatUnits(balance, decimals)})`);

    symbol = await stableTokenOut.symbol();
    decimals = await stableTokenOut.decimals();
    balance = await stableTokenOut.balanceOf(account.address);
    console.log(`Final ${symbol} balance: ${ethers.utils.formatUnits(balance, decimals)})`);

};


const main = async () => {
    const signer: SignerWithAddress = (await ethers.getSigners())[0];

    if (network.name == 'localhost' || network.name == 'hardhat' || network.name == 'rinkeby' || network.name == 'mainnet') {
        throw new Error("Only supported on sChains (with ETHC)")
    }

    console.log(`Swapping from ${signer.address} on ${network.name}`);

    await swapERC20ToUSDT(true,  // true to simulate and not swap
        ETHC_ADDR, "0.001", signer);
  
};
  
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});
