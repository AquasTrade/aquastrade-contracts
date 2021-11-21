import fs from "fs";
import { ethers, network } from "hardhat";
import { utils, BigNumber } from "ethers";
import { RubyMasterChef, UniswapV2Factory, UniswapV2Router02 } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const routerAddr = require(`../deployments/${network.name}/UniswapV2Router02.json`).address;

const rubyAddr = require(`../deployments/${network.name}/RubyToken.json`).address;
const usdcAddr = require(`../deployments/${network.name}/MockUSDC.json`).address;
const usdtAddr = require(`../deployments/${network.name}/MockUSDT.json`).address;
const wethAddr = require(`../deployments/${network.name}/WETH.json`).address;

const swapExactTokensForTokens = async (
  router: UniswapV2Router02,
  tokenA: string,
  tokenB: string,
  amountIn: BigNumber,
  amountOutMin: BigNumber,
  to: string,
  deadline: BigNumber,
) => {
  const res = await router.swapExactTokensForTokens(amountIn, amountOutMin, [tokenA, tokenB], to, deadline);

  const receipt = await res.wait(1);

  if (receipt.status) {
    console.log(`Swap successful from: ${tokenA}, to: ${tokenB}`);
  } else {
    console.log(`Could not swap ${tokenA} for ${tokenB}`);
  }
};

const main = async () => {
  const router: UniswapV2Router02 = (await ethers.getContractAt("UniswapV2Router02", routerAddr)) as UniswapV2Router02;

  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  const stableAmountIn = utils.parseUnits("10000", 6);
  const stableAmountOutMin = utils.parseUnits("9950", 6);

  await swapExactTokensForTokens(
    router,
    usdcAddr,
    usdtAddr,
    stableAmountIn,
    stableAmountOutMin,
    deployer.address,
    deadline,
  );
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
