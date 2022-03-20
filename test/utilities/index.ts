import { ethers } from "hardhat";
import { RubyToken, UniswapV2Pair, RubyStaker } from "../../typechain";
import { expect } from "chai";
import { BigNumber } from "ethers";

export const BASE_TEN = 10;
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export function encodeParameters(types: any, values: any) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

export async function prepare(thisObject: any, contracts: any) {
  for (let i in contracts) {
    let contract = contracts[i];
    thisObject[contract] = await ethers.getContractFactory(contract);
  }
  thisObject.signers = await ethers.getSigners();
  thisObject.alice = thisObject.signers[0];
  thisObject.bob = thisObject.signers[1];
  thisObject.carol = thisObject.signers[2];
  thisObject.dev = thisObject.signers[3];
  thisObject.alicePrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  thisObject.bobPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  thisObject.carolPrivateKey = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
}

export async function deploy(thisObject: any, contracts: any) {
  for (let i in contracts) {
    let contract = contracts[i];
    thisObject[contract[0]] = await contract[1].deploy(...(contract[2] || []));
    await thisObject[contract[0]].deployed();
  }
}

export async function createRLP(thisObject: any, name: any, tokenA: any, tokenB: any, amount: any) {
  const createPairTx = await thisObject.factory.createPair(tokenA.address, tokenB.address);

  const _pair = (await createPairTx.wait()).events[0].args.pair;

  thisObject[name] = await thisObject.UniswapV2Pair.attach(_pair);

  await tokenA.transfer(thisObject[name].address, amount);
  await tokenB.transfer(thisObject[name].address, amount);

  await thisObject[name].mint(thisObject.alice.address);
}
// Defaults to e18 using amount * 10^18
export function getBigNumber(amount: any, decimals = 18) {
  return BigNumber.from(amount).mul(BigNumber.from(BASE_TEN).pow(decimals));
}

export const assertRubyConversion = async (
  testState: any,
  burnPercent: number,
  lpToken: UniswapV2Pair,
  rubyConvertedAmount: BigNumber,
  rubyTotalSupplyBefore: BigNumber,
  rubyTotalSupplyAfter: BigNumber
) => {
  const makerBalanceRuby = await testState.ruby.balanceOf(testState.rubyMaker.address);
  const makerBalanceLP = await lpToken.balanceOf(testState.rubyMaker.address);
  const stakerBalance = await testState.ruby.balanceOf(testState.staker.address);
  // total supply should shrink
  const totalSupplyDifference = rubyTotalSupplyBefore.sub(rubyTotalSupplyAfter);

  const burned = rubyConvertedAmount.mul(BigNumber.from(burnPercent)).div(BigNumber.from(100));
  const distributed = rubyConvertedAmount.sub(burned);


  expect(makerBalanceRuby).to.equal(0);
  expect(makerBalanceLP).to.equal(0);
  // lte & gte used because of rounding error of 1 wei
  expect(stakerBalance).to.be.lte(distributed.add(1)); 
  expect(stakerBalance).to.be.gte(distributed.sub(1)); 



  expect(rubyConvertedAmount).to.equal(distributed.add(burned));
  // lte & gte used because of rounding error of 1 wei
  expect(totalSupplyDifference).to.lte(burned.add(1));
  expect(totalSupplyDifference).to.gte(burned.sub(1));

};

export const assertStakerBalances = async (stakerContract: RubyStaker, user: string, range: Array<number>) => {
  const earningsResult = await stakerContract.earnedBalances(user);
  const unlockedBalance = await stakerContract.unlockedBalance(user);
  const [amount, penaltyAmount] = await stakerContract.withdrawableBalance(user);


  expect(earningsResult.total).to.be.to.be.within(range[0], range[1]);
  expect(earningsResult.earningsData[0].amount).to.be.within(range[0], range[1]);
  expect(unlockedBalance).to.be.eq(0);

  const expectedClaimableMin = Math.floor(range[0] / 2);
  const expectedClaimableMax = Math.floor(range[1] / 2);
  expect(amount).to.be.within(expectedClaimableMin, expectedClaimableMax);
  expect(penaltyAmount).to.be.within(expectedClaimableMin, expectedClaimableMax);

  // TODO: Expect earningsResult.earningsData[0].unlockTime
};

export * from "./time";
