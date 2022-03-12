/* eslint no-use-before-define: "warn" */
import fs from "fs";
import chalk from "chalk";
import { config, ethers, run, network } from "hardhat";
import { BigNumber, utils } from "ethers";
import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import l2Artifacts from "../../ima_bridge/l2_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();

import { address as RubyMainnet } from "../../deployments/rinkeby/RubyTokenMainnet.json";

import { address as Ruby } from "../../deployments/skaleTestnet/RubyToken.json";

const registerL2TokensToIMA = async (signer: SignerWithAddress) => {
  const tokenManagerAddress = l2Artifacts.token_manager_erc20_address;
  const tokenManagerABI = l2Artifacts.token_manager_erc20_abi;
  const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);

  let res = await tokenManagerContract.addERC20TokenByOwner(RubyMainnet, Ruby);
  await res.wait(1);

  const rubyAddress = await tokenManagerContract.clonesErc20(RubyMainnet);


  console.log("TokenManager registered tokens: ");
  console.log(`Ruby, original: ${Ruby}, registered: ${rubyAddress}`);
};

const registerL1TokensToIMA = async (signer: SignerWithAddress) => {
  const depositBoxAddress = l1Artifacts.deposit_box_erc20_address;
  const depositBoxABI = l1Artifacts.deposit_box_erc20_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  const rubyExists = await depositBoxContract.getSchainToERC20("melodic-murzim", RubyMainnet);

  let res;

  if (!rubyExists) {
    console.log("Registering RUBY...");
    res = await depositBoxContract.addERC20TokenByOwner(process.env.TESTNET_CHAINNAME, RubyMainnet);
    await res.wait(1);
  }

  const sChainHash = "0x7cef6e298b91c11477b769ff449417928f4d2bcf03594bb34bbc24ed08d3fdf0";
  const registeredRubyAddress = await depositBoxContract.schainToERC20(sChainHash, RubyMainnet);

  console.log("Deposit box registered tokens: ");
  console.log(`Ruby, original: ${RubyMainnet}, registered: ${registeredRubyAddress}`);
};

const main = async () => {
  // console.log("process argv", process.argv);

  const signer: SignerWithAddress = (await ethers.getSigners())[0];

  if (network.name === "skaleTestnet") {
    await registerL2TokensToIMA(signer);
  } else if (network.name === "rinkeby") {
    await registerL1TokensToIMA(signer);
  }
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });