
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, tenderly, run } = require("hardhat");
const { utils, } = require("ethers");
const {getAddresses} = require('../utils/addresses');
const { add } = require("ramda");


const addLpToPool = async (masterChef, lpTokenAddr, allocPoints) => {

    const res = await masterChef.add(allocPoints, lpTokenAddr, true);
    const receipt = await res.wait(1);

    if(receipt.status) {
      console.log(`Adding to MasterChef successful, LP: ${lpTokenAddr}`);
    } else {
      console.log(`Adding to MasterChef failed, LP: ${lpTokenAddr}`);
    }

    

}


const debug = async (masterChef) => {

  const numPools = await masterChef.poolLength();

  console.log("Num pools: ", numPools.toNumber());

  for (let i = 0; i < numPools; i++) {
    const pool = await masterChef.poolInfo(i);
    console.log(`Pool info ${i}: `, pool)

  }
  const totalAllocPoint = await masterChef.totalAllocPoint();
  const rubyPerBlock = await masterChef.rubyPerBlock();
  
  console.log("Total alloc points ", totalAllocPoint);
  console.log("Ruby per block ", rubyPerBlock);

};

const main = async () => {
    
    const addresses = getAddresses();
    const masterChef =  await ethers.getContractAt('MasterChef', addresses.MasterChef);

    const dummyLps =  addresses.dummyLps;

    for (let i = 0; i < dummyLps.length; i++ ) {
      await addLpToPool(masterChef, dummyLps[i], 100);
    }

    await debug(masterChef);
    


};
  
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  