/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import l2Artifacts from "../../ima_bridge/l2_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();

import { address as RubyMainnet } from "../../deployments/rinkeby/RubyTokenMainnet.json";
import { address as RinkebyDAI } from "../../deployments/rinkeby/MockDAI.json";
import { address as RinkebyUSDC } from "../../deployments/rinkeby/MockUSDC.json";
import { address as RinkebyUSDP } from "../../deployments/rinkeby/MockUSDP.json";
import { address as RinkebyUSDT } from "../../deployments/rinkeby/MockUSDT.json";

/* Note: this hardcodes the configuration networkName=chain-name: rubyNewChain=fancy-rasalhague
   for a new test chain, change the network name and the chain name appropriately */
import { address as RubyUSDC } from "../../deployments/rubyNewChain/RubyUSDC.json";
import { address as RubyUSDT } from "../../deployments/rubyNewChain/RubyUSDT.json";
import { address as RubyDAI } from "../../deployments/rubyNewChain/RubyDAI.json";
import { address as RubyUSDP } from "../../deployments/rubyNewChain/RubyUSDP.json";
import { address as Ruby } from "../../deployments/rubyNewChain/RubyToken.json";

const SCHAIN_NAME = "fancy-rasalhague";

const registerL2TokensToIMA = async (signer: SignerWithAddress) => {
  const tokenManagerAddress = l2Artifacts.token_manager_erc20_address;
  const tokenManagerABI = l2Artifacts.token_manager_erc20_abi;
  const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);

  let res = await tokenManagerContract.addERC20TokenByOwner("Mainnet", RubyMainnet, Ruby);
  const receipt = await res.wait(1);

  res = await tokenManagerContract.addERC20TokenByOwner("Mainnet", RinkebyDAI, RubyDAI);
  await res.wait(1);

  res = await tokenManagerContract.addERC20TokenByOwner("Mainnet", RinkebyUSDP, RubyUSDP);
  await res.wait(1);

  res = await tokenManagerContract.addERC20TokenByOwner("Mainnet", RinkebyUSDT, RubyUSDT);
  await res.wait(1);

  res = await tokenManagerContract.addERC20TokenByOwner("Mainnet", RinkebyUSDC, RubyUSDC);
  await res.wait(1);

  console.log(`L2 tokens registered to IMA`);

};


const registerL1TokensToIMA = async (signer: SignerWithAddress) => {
  const depositBoxAddress = l1Artifacts.deposit_box_erc20_address;
  const depositBoxABI = l1Artifacts.deposit_box_erc20_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  let res = await depositBoxContract.addERC20TokenByOwner(SCHAIN_NAME, RubyMainnet);
  await res.wait(1);

  console.log("Registering USDC...");
  res = await depositBoxContract.addERC20TokenByOwner(SCHAIN_NAME, RinkebyUSDC);
  await res.wait(1);

  console.log("Registering DAI...");
  res = await depositBoxContract.addERC20TokenByOwner(SCHAIN_NAME, RinkebyDAI);
  await res.wait(1);

  console.log("Registering USDP...");
  res = await depositBoxContract.addERC20TokenByOwner(SCHAIN_NAME, RinkebyUSDP);
  await res.wait(1);

  console.log("Registering USDT...");
  res = await depositBoxContract.addERC20TokenByOwner(SCHAIN_NAME, RinkebyUSDT);
  await res.wait(1);

  console.log(`L1 tokens registered to IMA`);
};

const main = async () => {

  const signer: SignerWithAddress = (await ethers.getSigners())[0];

  if (network.name === "rubyNewChain" ) {
    await registerL2TokensToIMA(signer);
  } else if (network.name === "rinkeby") {
    await registerL1TokensToIMA(signer);
  } else if (network.name === "mainnet") {
    throw new Error("Europa chain is MS controlled. Call DepositBox.addERC20TokenByOwner from Gnosis Safe");
  } else if (network.name === "europa") {
    throw new Error("Europa chain is MS controlled. Use multisig-cli and Gnosis Safe");
  } else {
    console.log("Network not supported")
  }
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
