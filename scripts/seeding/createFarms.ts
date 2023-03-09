import fs from "fs";
import { ethers, network } from "hardhat";
import { RubyMasterChef } from "../../typechain";

import { debugChefPools } from "../utils";
import { addDoubleRewardFarm, addSingleRewardFarm } from "./utils";


const main = async () => {
  if (network.name !== "europa") {
    throw new Error("Not Supported (anyway this is dangerous, you chould check the numbers here")
  }

  const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
  const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", masterChefAddr)) as RubyMasterChef;

  const pools = JSON.parse(fs.readFileSync(`./deployment_addresses/new_pools_addr.${network.name}.json`, {encoding: "utf-8"}));

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

    await addDoubleRewardFarm(masterChef, lpAddr, 180, REWARDER_ADDR);
  }

  // USDP-WBTC pool with USDP bonus token
  if (false) {
    const REWARDER_ADDR = require(`../../deployments/${network.name}/RewarderUSDP_WBTCUSDP.json`).address;
    const REWARDER_ABI = require(`../../deployments/${network.name}/RewarderUSDP_WBTCUSDP.json`).abi;
    const rewarder = new ethers.Contract(REWARDER_ADDR, REWARDER_ABI, ethers.provider);

    // safety check
    const lpAddr = pools['usdpWBTC'];
    const rlpAddr = await rewarder.lpToken()
    if (lpAddr !== rlpAddr) {
      throw new Error("rewarder does not agree with lptoken")
    }

    await addDoubleRewardFarm(masterChef, lpAddr, 180, REWARDER_ADDR);
  }

  // USDP-ETHC pool with USDP bonus token
  if (false) {
    const REWARDER_ADDR = require(`../../deployments/${network.name}/RewarderUSDP_ETHCUSDP.json`).address;
    const REWARDER_ABI = require(`../../deployments/${network.name}/RewarderUSDP_ETHCUSDP.json`).abi;
    const rewarder = new ethers.Contract(REWARDER_ADDR, REWARDER_ABI, ethers.provider);

    // safety check
    const lpAddr = pools['usdpETHC'];
    const rlpAddr = await rewarder.lpToken()
    if (lpAddr !== rlpAddr) {
      throw new Error("rewarder does not agree with lptoken")
    }

    await addDoubleRewardFarm(masterChef, lpAddr, 200, REWARDER_ADDR);
  }

  // USDP-RUBY pool with SKL bonus token
  if (false) {
    const REWARDER_ADDR = require(`../../deployments/${network.name}/RewarderSKL_RUBYUSDP.json`).address;
    const REWARDER_ABI = require(`../../deployments/${network.name}/RewarderSKL_RUBYUSDP.json`).abi;
    const rewarder = new ethers.Contract(REWARDER_ADDR, REWARDER_ABI, ethers.provider);

    // safety check
    const lpAddr = pools['usdpRUBY'];
    const rlpAddr = await rewarder.lpToken()
    if (lpAddr !== rlpAddr) {
      throw new Error("rewarder does not agree with lptoken")
    }

    await addDoubleRewardFarm(masterChef, lpAddr, 240, REWARDER_ADDR);
  }


  // StableSwap
  if (false) {
    const lpAddr = require(`../../deployments/${network.name}/RubyUSD4PoolLPToken.json`).address;
    await addSingleRewardFarm(masterChef, lpAddr, 200);
  }

  await debugChefPools(masterChef);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
