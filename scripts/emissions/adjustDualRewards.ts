import { ethers } from "hardhat";
import { SimpleRewarderPerSec } from "../../typechain";

import { getDependents } from "./utils";
import { getFarmInfoByLpToken, debugChefPool } from "../utils";


// WARNING: Assumes decimals=18, e.g. will not work for USDT, BTC, USDC (if we were to have dual rewards with this assets)
const HUMAN_AMOUNT = "1";
const INPUT_PAIR_NAME = 'usdpSKL';// usdpWBTC, usdpETHC, usdpRUBY, usdpSKL

const getDualRewarder = async (address: string) => {
  const rewarder: SimpleRewarderPerSec = (await ethers.getContractAt("SimpleRewarderPerSec", address)) as SimpleRewarderPerSec;
  return rewarder;
}

const main = async () => {
  const { masterChef, factory, ssAddr, pools } = await getDependents();

  const lpTokenAddr = pools[INPUT_PAIR_NAME];
  if (typeof lpTokenAddr === 'undefined') {
    console.error(`error: could not find lpTokenAddr for ${INPUT_PAIR_NAME}`)
    return;
  }

  console.log(`Updating farming configuration for AMM pool ${INPUT_PAIR_NAME}`)

  const farmInfo = await getFarmInfoByLpToken(lpTokenAddr, masterChef, factory, ssAddr)
  if (farmInfo === null) {
    console.error(`error: could not find farm pool for AMM pair ${INPUT_PAIR_NAME}`)
    return;
  }

  if (farmInfo.rewarderInfo === null) {
    console.error(`error: could not find farm pool dual rewarder for AMM pair ${INPUT_PAIR_NAME}`)
    return;
  }

  const amount = ethers.utils.parseUnits(HUMAN_AMOUNT, 18);

  console.log(`Updating dual reward reward token ${farmInfo.rewarderTokenInfo?.symbol} to ${HUMAN_AMOUNT}/s (${amount.toString()} wei)`)
  
  const rewarder = await getDualRewarder(farmInfo.rewarder);

  if (false) {
    const res = await rewarder.setRewardRate(amount);
    await res.wait(1);
    console.log("Dual rewarder reward rate updated: ", res.hash)
  } else {
    console.log("DRY RUN")
  }

  await debugChefPool(farmInfo, factory, ssAddr);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

/*

$ npx hardhat run scripts/emissions/adjustDualRewards.ts --network rubyNewChain

*/