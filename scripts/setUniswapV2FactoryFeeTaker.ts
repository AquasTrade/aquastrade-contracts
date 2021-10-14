
/* eslint no-use-before-define: "warn" */
import fs from "fs";
import { ethers, network } from "hardhat";

import { UniswapV2Factory, UniswapV2Router02, MockERC20, UniswapV2Pair } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { assert } from "console";

const factoryAddr = require(`../deployments/${network.name}/UniswapV2Factory.json`).address;
const rubyMakerAddr = require(`../deployments/${network.name}/RubyMaker.json`).address;


const main = async () => {

    const deployer: SignerWithAddress = (await ethers.getSigners())[0];
    const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;
  
    await factory.connect(deployer).setFeeTo(rubyMakerAddr);

    const feeTo = await factory.feeTo();
    console.log("Fee to: ", feeTo);
    assert(feeTo === rubyMakerAddr);

  };
  
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
  