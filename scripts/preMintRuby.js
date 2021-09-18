
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, tenderly, run } = require("hardhat");
const { utils } = require("ethers");
const {getAddresses} = require('../utils/addresses');


const main = async () => {

    const [deployer] = await ethers.getSigners()
    const deployerAddr = deployer.address;

    const PREMINT_AMOUNT = 100_000_000; // 100 mil
    console.log("premint amount", PREMINT_AMOUNT);
    
    const ruby = await ethers.getContract("RubyToken");
    console.log("ruby token", ruby.address);

    const amountWei = utils.parseUnits(PREMINT_AMOUNT.toString())
    const res = await ruby.mint(deployerAddr,  amountWei);
    
    const receipt = await res.wait(1);

    if(receipt.status) {
        console.log("Ruby successfully preminted to deployer");
        const balanceOf = await ruby.balanceOf(deployerAddr);
        console.log(`Deployer balance: ${utils.formatUnits(balanceOf)}`)
    } else {
        console.log("Error while preminting Ruby tokens.")
    }

};
  
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  