import { RubyMasterChef } from "../../typechain";

import { ZERO_ADDR, debugChefPool, getFarmInfoByID, getFarmInfoByLpToken, FarmInfoType } from "../utils";
import { getDependents, setPoolEmissionRate } from "./utils";

const DRY_RUN = true;

const ALLOC_POINTS = 1;
// can refer to the pool by either by AMM lp addr, or pool ID
const INPUT_PAIR_NAME = "usdpSKL";
const INPUT_POOL_ID = -1;

const main = async () => {
  const { masterChef, factory, ssAddr, pools } = await getDependents();

  let poolInfo: FarmInfoType | null;

  if (INPUT_POOL_ID >= 0) {
    poolInfo = await getFarmInfoByID(INPUT_POOL_ID, masterChef, factory, ssAddr);
  } else {
    const lpAddr = pools[INPUT_PAIR_NAME];
    poolInfo = await getFarmInfoByLpToken(lpAddr, masterChef, factory, ssAddr);
    if (poolInfo === null) {
      console.error(`error: could not find pool for lp token named ${INPUT_PAIR_NAME}`);
      return;
    }
  }

  await setPoolEmissionRate(DRY_RUN, poolInfo.id, ALLOC_POINTS, masterChef);
  await debugChefPool(poolInfo, factory, ssAddr);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

/*

$ npx hardhat run scripts/emissions/adjustPoolEmissionRate.ts --network rubyNewChain

*/
