/* eslint no-use-before-define: "warn" */

import { getDependents } from "./utils";
import { adjustPoolEmissionRate } from "./adjustPoolEmissionRate" 

const DRY_RUN = true;
const POOL_IDS = {
    0: 100,
    1: 100,
    2: 100,
    3: 100,
    4: 100
}

const main = async () => {
  const { masterChef, factory, ssAddr } = await getDependents();

  Object.entries(POOL_IDS).forEach(([pool_id, alloc_points]) => {
    adjustPoolEmissionRate(DRY_RUN, Number(pool_id), alloc_points, masterChef)
  });

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });