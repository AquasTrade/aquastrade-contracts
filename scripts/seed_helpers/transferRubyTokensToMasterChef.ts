import { ethers, network } from "hardhat";
import { RubyTokenMintable, RubyToken } from "../../typechain";

const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
// const rubyTokenMintableAddr = require(`../../deployments/${network.name}/RubyTokenMintable.json`).address; // for testing purposes only
const rubyTokenSchainAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;


const main = async () => {
//   const rubyToken: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;
  const rubyToken: RubyToken = (await ethers.getContractAt("RubyToken", rubyTokenSchainAddr)) as RubyToken;
  // const rubyToken: RubyTokenMintable = (await ethers.getContractAt("RubyTokenMintable", rubyTokenMintableAddr)) as RubyTokenMintable;

  const amount = ethers.utils.parseUnits("100000", 18);
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
