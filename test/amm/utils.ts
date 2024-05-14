import { UniswapV2Factory, UniswapV2Router02 } from "../../typechain";
import { expect } from "chai";

import { ethers } from "hardhat";
import { approveTokens } from "../utilities/seeding";
import { deployMockTokens } from "../utilities/deployment";

export const addLiquidity = async (ownerAddress: string, router: UniswapV2Router02, factory: UniswapV2Factory) => {
  expect(await factory.pairCreators(ownerAddress)).to.be.eq(false);
  expect(await factory.pairCreators(router.address)).to.be.eq(false);

  await factory.setPairCreator(ownerAddress, true);
  await factory.setPairCreator(router.address, true);

  expect(await factory.pairCreators(ownerAddress)).to.be.eq(true);
  expect(await factory.pairCreators(router.address)).to.be.eq(true);

  let mockTokenSupply = ethers.utils.parseUnits("10000000000", 18);
  let token1Liquidity = ethers.utils.parseUnits("1000000000", 18);
  let token2Liquidity = ethers.utils.parseUnits("1000000000", 18);

  const mockTokens = await deployMockTokens(mockTokenSupply);

  const blockNumber = await ethers.provider.getBlockNumber();
  const blockData = await ethers.provider.getBlock(blockNumber);
  const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

  await approveTokens([mockTokens[0], mockTokens[1]], router.address, ethers.constants.MaxUint256);

  await expect(
    router.addLiquidity(
      mockTokens[0].address,
      mockTokens[1].address,
      token1Liquidity,
      token2Liquidity,
      token1Liquidity,
      token2Liquidity,
      ownerAddress,
      deadline,
    ),
  ).to.emit(factory, "PairCreated");

  return {
    deadline: deadline,
    token1: mockTokens[0],
    token2: mockTokens[1],
  };
};
