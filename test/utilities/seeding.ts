
const { ethers, upgrades } = require("hardhat");

import { BigNumber } from "ethers";
import {
    Swap,
    ERC20,
    UniswapV2Factory,
    RubyMaker,
    MockERC20
  } from "../../typechain";
  
  export const approveTokens = async (mockTokens: Array<MockERC20>, spender: string, amount: BigNumber) => {
    for (let i = 0; i < mockTokens.length; i++) {
      let tx = await mockTokens[i].approve(spender, amount);
      await tx.wait(1);
    }
  };


export const addStablePoolLiquidity = async (
    rubyStablePool: Swap,
    tokens: Array<ERC20>,
    liquidityAmounts: Array<BigNumber>,
  ) => {
    const blockNumber = await ethers.provider.getBlockNumber();
    const blockData = await ethers.provider.getBlock(blockNumber);
    const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
  
    for (let i = 0; i < tokens.length; i++) {
      const tx = await tokens[i].approve(rubyStablePool.address, liquidityAmounts[i]);
      await tx.wait(1);
    }
  
    const tx = await rubyStablePool.addLiquidity(liquidityAmounts, 0, deadline);
    await tx.wait(1);
  };