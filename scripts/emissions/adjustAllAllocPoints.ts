/* eslint no-use-before-define: "warn" */

import { getDependents } from "./utils";
import { setPoolEmissionRate } from "./utils";
import { debugChefPool } from "../utils";

const DRY_RUN = true;
const POOL_IDS = {
  0: 180, // SKL
  1: 100, // WBTC
  2: 180, // ETHC
  3: 320, // RUBY
  4: 200, // 4Pool
  5: 20, // SKILL
};

const main = async () => {
  const { masterChef, factory, ssAddr } = await getDependents();

  for (const [pool_id, alloc_points] of Object.entries(POOL_IDS)) {
    const poolInfo = await setPoolEmissionRate(DRY_RUN, Number(pool_id), alloc_points, masterChef);
    await debugChefPool(poolInfo, factory, ssAddr);
  }
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
