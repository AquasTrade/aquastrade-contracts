import fs from "fs";
import { ethers, network } from "hardhat";
import { utils } from "ethers";
import { RubyMasterChef, UniswapV2Factory } from "../../typechain";

const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
const factoryAddr = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;

// const rubyAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
// const usdcAddr = require(`../../deployments/${network.name}/USDC.json`).address;
// const usdtAddr = require(`../../deployments/${network.name}/USDT.json`).address;
// const usdpAddr = require(`../../deployments/${network.name}/USDP.json`).address;
// const wethAddr = require(`../../deployments/${network.name}/WETH.json`).address;

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

const getLpAddrs = async (factory: UniswapV2Factory) => {
  const lpAddrs: string[] = [
    // '0xA443b6204946b929147CEbF79482c8A1D6b01117', // eth-usdp
    // '0x82D747306CfBEc02989AA608BF5FE7145dCF2e47', // eth-usdt
    // '0x13c4398BB59F7CE12Fd58a2ae307E8Ca08fB51D5', // eth-usdc
    // '0xAAaEe87F8F7bEf70f0755874760E1f64005012B1', // usdc-usdt
    // '0x06072351e4d6d36C05ca9a562Ca876932De9699f', // usdc-usdp
    // '0x6cE9C57Fe5b680F5e132c369715554087dFCec9d', // usdt-usdp
    '0x2b7cD677Ccb6e5D03179f582737B8d0AB743615F', // eth-ruby
  ];

  return lpAddrs;
};

const main = async () => {
  const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", masterChefAddr)) as RubyMasterChef;
  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;

  // Need to generate Mock LP addresses first (hardhat run createMockLPs.ts)
  // const lpAddrs = JSON.parse(fs.readFileSync("./utils/mock_lp_addrs.json", {encoding: "utf-8"}));

  // Lets seed the master chef with more real LPs (stables and ruby)
  const lpAddrs = await getLpAddrs(factory);

  for (let i = 0; i < lpAddrs.length; i++) {
    await addSingleRewardFarms(masterChef, lpAddrs[i], 100);
  }

  await debug(masterChef);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
