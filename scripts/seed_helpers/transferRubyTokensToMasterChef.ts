import { ethers, network } from "hardhat";

const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;

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

  const rubyToken = await getRubyToken();

  const amount = ethers.utils.parseUnits("130000000", 18);
  const res = await rubyToken.transfer(masterChefAddr, amount);
  await res.wait(1);

  const balanceOfMasterChef = ethers.utils.formatUnits(await rubyToken.balanceOf(masterChefAddr));

  console.log("Balance Of RubyMasterChef", balanceOfMasterChef);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
