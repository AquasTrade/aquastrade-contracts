import { ethers, network } from "hardhat";

import { RubyStaker } from "../../typechain";

const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
const stakerAddr = require(`../../deployments/${network.name}/RubyStaker.json`).address;
const makerAddr = require(`../../deployments/${network.name}/RubyMaker.json`).address;

const getRubyToken = async () => {

  let rubyToken;

  if(network.name === 'localhost') {
    const rubyTokenMainnet = require(`../../deployments/${network.name}/RubyTokenMainnet.json`).address; 
    rubyToken =  (await ethers.getContractAt("RubyTokenMainnet", rubyTokenMainnet));
  } else {
    const rubyTokenSchainAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
    rubyToken =  (await ethers.getContractAt("RubyToken", rubyTokenSchainAddr));
  }

  return rubyToken;

}


const main = async () => {

    const rubyStaker: RubyStaker = <RubyStaker>(await ethers.getContractAt("RubyStaker", stakerAddr));

    const rubyToken = await getRubyToken();

    console.log("ruby master chef", masterChefAddr);
    let tx = await rubyStaker.setRewardMinter(masterChefAddr);
    await tx.wait(1);

    // tx = await rubyStaker.addReward(rubyToken.address, makerAddr);
    // await tx.wait(1);

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
