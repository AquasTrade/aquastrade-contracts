import { ethers, network } from "hardhat";
const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;

const pool_id = 0;
const allocation_points = 250;

const getMasterChef = async () => {
  const res = await ethers.getContractAt("RubyMasterChef", masterChefAddr);
  return res;
}

const main = async () => {
  const masterChef = await getMasterChef();
  const res = await masterChef.set(
    pool_id,
    allocation_points,
    masterChefAddr,
    false);

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

$ npx hardhat run scripts/emissions/adjustPoolEmissionRate.ts --network rubyNewChain

*/