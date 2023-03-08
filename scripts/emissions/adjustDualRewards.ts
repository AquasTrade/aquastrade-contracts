import fs from "fs";
import { ethers, network } from "hardhat";
import { SimpleRewarderPerSec } from "../../typechain";
const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;

const HUMAN_AMOUNT = "1";
const INPUT_PAIR_NAME = 'usdpSKL';// usdpWBTC, usdpETHC, usdpRUBY, usdpSKL

const getMasterChef = async () => {
  const res = await ethers.getContractAt("RubyMasterChef", masterChefAddr);
  return res;

}

const getDualRewarderAddress = async () => {

  const pools = JSON.parse(fs.readFileSync(`./deployment_addresses/new_pools_addr.${network.name}.json`, {encoding: "utf-8"}));

  const LP_ADDRESS = pools[INPUT_PAIR_NAME];
  
  if (typeof LP_ADDRESS === 'undefined') {
    console.log("LP address missing")
    return;
  }

  const masterChef = await getMasterChef();
  const farm_pool_length = await masterChef.poolLength();

  if (typeof farm_pool_length === 'undefined') {
    console.log("getMasterChef bug")
    return;
  }

  let address ;
  for (let i = 0; i < farm_pool_length; i++) {
    const farm_pool = await masterChef.poolInfo(i);

    if (typeof farm_pool === 'undefined') {
      console.log("farm_pool bug")
      break;
    }

    const reward_contract = farm_pool.rewarder;
    const lpToken = farm_pool.lpToken;

    if (lpToken === LP_ADDRESS) {
      console.log("matched LP Token")

      if (reward_contract != '0x0000000000000000000000000000000000000000') {
        console.log("Dual Rewarder on Farm Pool: ", i);
        address = reward_contract;
      }

    }

  }

  return address;
}

const getDualRewarder = async (address: string) => {
  const rewarder: SimpleRewarderPerSec = (await ethers.getContractAt("SimpleRewarderPerSec", address)) as SimpleRewarderPerSec;
  return rewarder;
}

const main = async () => {
  // WARNING: 
  // Decimals 18 will not work for USDT, BTC, USDC (if we were to have dual rewards with this assets)
  // Decimals 18 only supports RUBY, SKL, and USDP Dual Rewaders
  const amount = ethers.utils.parseUnits(HUMAN_AMOUNT, 18);
  console.log("TOKEN PER SECOND wei Value: ", amount.toString())

  const rewarder_address = await getDualRewarderAddress();

  if (typeof rewarder_address === 'undefined') {
    console.log("rewarder_address: missing ")
    return;
  }

  const rewarder = await getDualRewarder(rewarder_address);
  const res = await rewarder.setRewardRate(amount);

  await res.wait(1);

  console.log("Farm Pool allocation points updated: ", res.hash)

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