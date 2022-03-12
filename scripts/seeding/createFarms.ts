import fs from "fs";
import { ethers, network } from "hardhat";
import { utils } from "ethers";
import { RubyMasterChef, UniswapV2Factory } from "../../typechain";

const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
const factoryAddr = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;

const addSingleRewardFarms = async (masterChef: RubyMasterChef, lpTokenAddr: string, allocPoints: number) => {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const res = await masterChef.add(allocPoints, lpTokenAddr, zeroAddress);
  const receipt = await res.wait(1);

  if (receipt.status) {
    console.log(`Adding to RubyMasterChef successful, LP: ${lpTokenAddr}`);
  } else {
    console.log(`Adding to RubyMasterChef failed, LP: ${lpTokenAddr}`);
  }
};

const debug = async (masterChef: RubyMasterChef) => {
  const numPools = (await masterChef.poolLength()).toNumber();

  console.log("Num pools: ", numPools);

  for (let i = 0; i < numPools; i++) {
    const pool = await masterChef.poolInfo(i);
    console.log(`Pool info ${i}: `, pool);
  }
  const totalAllocPoint = (await masterChef.totalAllocPoint()).toNumber();
  const rubyPerSec = utils.formatUnits(await masterChef.rubyPerSec());

  console.log("Total alloc points ", totalAllocPoint);
  console.log("Ruby per second ", rubyPerSec);
};

const main = async () => {
  const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", masterChefAddr)) as RubyMasterChef;
  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;

  // Need to generate Mock LP addresses first (hardhat run createMockLPs.ts)
  const pools = JSON.parse(fs.readFileSync("./deployment_addresses/new_pools_addr.json", {encoding: "utf-8"}));
  const poolAddresses: string[] = Object.values(pools);
  
  console.log("pool addresses", poolAddresses)

  for (let i = 0; i < poolAddresses.length; i++) {
    await addSingleRewardFarms(masterChef, poolAddresses[i], 100);
  }

  await debug(masterChef);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });