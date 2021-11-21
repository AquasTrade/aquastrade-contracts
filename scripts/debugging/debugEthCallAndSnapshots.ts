/* eslint no-use-before-define: "warn" */
import fs from "fs";
import { ethers, network } from "hardhat";

import { UniswapV2Factory, UniswapV2Router02, MockERC20, UniswapV2Pair } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const routerAddr = require(`../deployments/${network.name}/UniswapV2Router02.json`).address;
const factoryAddr = require(`../deployments/${network.name}/UniswapV2Factory.json`).address;

const testEthCall = async (blockNumber: string | number = "latest") => {
  const pairAddr = "0x98a211F97e7D99017C50b343CaeF7aa3AA49cFCC"; // RUBY/USDC LP
  const univ2Pair: UniswapV2Pair = (await ethers.getContractAt("UniswapV2Pair", pairAddr)) as UniswapV2Pair;

  console.log("Encoding call data...");
  const callData = univ2Pair.interface.encodeFunctionData("symbol");

  console.log("Call data encoded:", callData);

  console.log(`eth_call (block: ${blockNumber})..."`);
  console.log("ethereum provider", ethers.provider);
  const callResultLatest = await ethers.provider.call({ to: pairAddr, data: callData }, blockNumber);

  console.log(`eth_call result (block: ${blockNumber}):`, callResultLatest);
  console.log(
    `eth_call result (block: ${blockNumber}), decoded:`,
    univ2Pair.interface.decodeFunctionResult("symbol", callResultLatest),
  );
};

const main = async () => {
  await testEthCall("latest");
  await testEthCall("0x25b2b3c60c0188749aea2ad38c33826da76d28ef7f9f1ccc4654891714592c9d");
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
