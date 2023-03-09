import { network } from "hardhat";

import { debugChefPools } from "../../utils";
import { addSingleRewardFarm } from "../../seeding/utils";
import { getDependents } from "../../emissions/utils";

const AMM_POOL_NAME = "usdpSKILL"
const DRY_RUN = true;

const main = async () => {
  if (network.name !== "europa") {
    throw new Error("Not Supported (anyway this is dangerous, you chould check the numbers here")
  }

  const { masterChef, pools } = await getDependents();
  const lpAddr = pools[AMM_POOL_NAME]

  console.log(`Creating single reward farm for ${AMM_POOL_NAME} lpAddr:${lpAddr}`)

  if (!DRY_RUN) {
    await addSingleRewardFarm(masterChef, lpAddr, 20);
  }

  await debugChefPools(masterChef);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
