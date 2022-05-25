// Transfer RUBY tokens to masterChef
import { ethers, network } from "hardhat";

const masterChefAddr = require(`../deployments/${network.name}/RubyMasterChef.json`).address;

const getRubyToken = async () => {

  let rubyToken;

  if(network.name === 'localhost') {
    const rubyTokenMainnet = require(`../deployments/${network.name}/RubyTokenMainnet.json`).address; 
    rubyToken =  (await ethers.getContractAt("RubyTokenMainnet", rubyTokenMainnet));
  } else {
    const rubyTokenSchainAddr = require(`../deployments/${network.name}/RubyToken.json`).address;
    rubyToken =  (await ethers.getContractAt("RubyToken", rubyTokenSchainAddr));
  }

  return rubyToken;

}

const main = async () => {

  const rubyToken = await getRubyToken();

  const balanceOfMasterChef1 = ethers.utils.formatUnits(await rubyToken.balanceOf(masterChefAddr), 18);
  console.log("Balance of RubyMasterChef", balanceOfMasterChef1);

  const HUMAN_AMOUNT = "100";
  console.log("Trasferring", HUMAN_AMOUNT, "RUBY to RubyMasterChef")

  const amount = ethers.utils.parseUnits(HUMAN_AMOUNT, 18);

  const res = await rubyToken.transfer(masterChefAddr, amount);
  await res.wait(1);

  const balanceOfMasterChef2 = ethers.utils.formatUnits(await rubyToken.balanceOf(masterChefAddr), 18);

  console.log("Balance of RubyMasterChef", balanceOfMasterChef2);
  console.log("Address of RubyMasterChef", masterChefAddr)
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });