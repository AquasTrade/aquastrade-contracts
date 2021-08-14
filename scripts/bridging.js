/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, tenderly, run } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");
const imaAbiRinkeby = require('../ima_bridge/rinkeby/abi.json')
require('dotenv').config()



const bridgeETHfromEthereumToSkale = async  (artifacts, signer, amount) => {

  console.log("Bridging ETH to Skale")
  const depositBoxAddress = artifacts.deposit_box_eth_address;
  const depositBoxABI = artifacts.deposit_box_eth_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);
  const res = await depositBoxContract.deposit(process.env.TESTNET_CHAINNAME, signer.address, {value:amount, gasLimit: 6500000});
  const recipe = await res.wait(1);
  console.log("recipe", recipe);

}


const bridgeERC20fromEthereumToSkale = async  (artifacts, signer, amount) => {


  console.log("Bridging ETH to Skale")
  const depositBoxAddress = artifacts.deposit_box_eth_address;
  const depositBoxABI = artifacts.deposit_box_eth_abi;

  console.log("deposit box address", depositBoxAddress);
  // console.log("deposit box abi", depositBoxABI);
  console.log("signer address", signer.address);


  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  console.log("signer address", signer.address);
  console.log("testnet chainname", process.env.TESTNET_CHAINNAME);

  const res = await depositBoxContract.deposit(process.env.TESTNET_CHAINNAME, signer.address, {value:amount, gasLimit: 6500000});

  const recipe = await res.wait(1);
  console.log("recipe", recipe);

}

const main = async () => {

  const signer = (await ethers.getSigners())[0];
  const amount = utils.parseUnits("0.01", 18);
  await bridgeETHfromEthereumToSkale(imaAbiRinkeby, signer, amount);

};


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
