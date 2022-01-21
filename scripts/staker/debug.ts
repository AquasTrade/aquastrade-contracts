import { ethers, network } from "hardhat";
import { utils, BigNumber } from "ethers";
import { RubyStaker } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const stakerAddr = require(`../../deployments/${network.name}/RubyStaker.json`).address;
const makerAddr = require(`../../deployments/${network.name}/RubyMaker.json`).address;

// const rubyAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
// const usdcAddr = require(`../../deployments/${network.name}/USDC.json`).address;
// const usdtAddr = require(`../../deployments/${network.name}/USDT.json`).address;
// const usdpAddr = require(`../../deployments/${network.name}/USDP.json`).address;
// const wethAddr = require(`../../deployments/${network.name}/WETH.json`).address;

const debug = async (staker: RubyStaker) => {
  const numRewards = (await staker.numRewards() as BigNumber).toNumber();
  const rewardMinter = await staker.rewardMinter();
  const makerSetAsRewardDistributor = await staker.rewardDistributors(1, makerAddr);

  console.log("numRewards", numRewards);
  console.log("rewardMinter", rewardMinter);
  console.log("makerSetAsRewardDistributor", makerSetAsRewardDistributor);


  for(let i =0; i < numRewards; i++) {
      const rewardData = await staker.rewardData(i);
      console.log(`reward data ${i}: `, rewardData);
  }

};


const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];
  const staker: RubyStaker = (await ethers.getContractAt("RubyStaker", stakerAddr)) as RubyStaker;

    await debug(staker);

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
