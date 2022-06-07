import fs from "fs";
import { ethers, network } from "hardhat";
import { RubyMasterChef } from "../../typechain";

import { debugChefPools } from "../utils";

const addDoubleRewardFarm = async (masterChef: RubyMasterChef, lpTokenAddr: string, allocPoints: number, rewarderAddr: string) => {
  const res = await masterChef.add(allocPoints, lpTokenAddr, rewarderAddr);
  const receipt = await res.wait(1);

  console.log(`Adding farm for LP token ${lpTokenAddr} with secondary rewarder ${rewarderAddr}`)

  if (receipt.status) {
    console.log('Adding to RubyMasterChef successful');
  } else {
    console.log('Adding to RubyMasterChef failed');
  }
};

const addSingleRewardFarm = async (masterChef: RubyMasterChef, lpTokenAddr: string, allocPoints: number) => {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  await addDoubleRewardFarm(masterChef, lpTokenAddr, allocPoints, zeroAddress);
};

const main = async () => {
  const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
  const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", masterChefAddr)) as RubyMasterChef;

  const pools = JSON.parse(fs.readFileSync(`./deployment_addresses/new_pools_addr.${network.name}.json`, {encoding: "utf-8"}));

  // USDP-ETHC pool
  if (false) {
    await addSingleRewardFarm(masterChef, pools['usdpETHC'], 100);
  }
  
  // USDP-Ruby pool
  if (false) {
    await addSingleRewardFarm(masterChef, pools['usdpRUBY'], 100);
  }

  // USDP-SKL pool with SKL bonus token
  if (false) {
    const REWARDER_ADDR = require(`../../deployments/${network.name}/RewarderSKL_SKLUSDP.json`).address;
    const REWARDER_ABI = require(`../../deployments/${network.name}/RewarderSKL_SKLUSDP.json`).abi;
    const rewarder = new ethers.Contract(REWARDER_ADDR, REWARDER_ABI, ethers.provider);

    // safety check
    const lpAddr = pools['usdpSKL'];
    const rlpAddr = await rewarder.lpToken()
    if (lpAddr !== rlpAddr) {
      throw new Error("rewarder does not agree with lptoken")
    }

    await addDoubleRewardFarm(masterChef, lpAddr, 100, REWARDER_ADDR);
  }

  // StableSwap
  if (false) {
    const lpAddr = require(`../../deployments/${network.name}/RubyUSD4PoolLPToken.json`).address;
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