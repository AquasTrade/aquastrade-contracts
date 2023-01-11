// Give PAIR_CREATORS_ROLE to UNISWAP FACTORY
import { ethers, network } from "hardhat";

// IMPORT CONTRACTS
const factoryAddress = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;
// ADDRESS 
const MSW_ADDRESS = '0xD244519000000000000000000000000000000000';

const main = async () => {

  const [deployer] = await ethers.getSigners();

  const address = deployer.address;

  const factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddress));

  const isCreator = await factory.pairCreators(address);
  console.log("is Creator::", isCreator, address)

  const isAdmin = await factory.admin();
  console.log("is Admin::", isAdmin)

  const isAddress = await factory.pairCreators(MSW_ADDRESS);
  console.log("is Address added::", isAddress, MSW_ADDRESS)

  if (isAddress === false) {
    const tx = await factory.setPairCreator(MSW_ADDRESS, true);
    const output = await tx.wait(1);
    console.log("Address Added Result :", output)
  }

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });