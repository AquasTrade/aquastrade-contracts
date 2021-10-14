
/* eslint no-use-before-define: "warn" */
import fs from "fs";
import { ethers, network } from "hardhat";

import { RubyBar, RubyToken} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { assert } from "console";
import { BigNumber } from "ethers";

const rubyBarAddr = require(`../deployments/${network.name}/RubyBar.json`).address;
const rubyMakerAddr = require(`../deployments/${network.name}/RubyMaker.json`).address;
const rubyTokenAddr = require(`../deployments/${network.name}/RubyToken.json`).address;


const main = async () => {

    const deployer: SignerWithAddress = (await ethers.getSigners())[0];
    const bar: RubyBar = (await ethers.getContractAt("RubyBar", rubyBarAddr)) as RubyBar;
    const ruby: RubyToken = (await ethers.getContractAt("RubyToken", rubyTokenAddr)) as RubyToken;

    const allowance = 200_000_000; // 200 mil, the total amount of RubyTokens

    const allowanceUnits = ethers.utils.parseUnits(allowance.toString(), 18);

    await bar.connect(deployer).setMakerAllowance(rubyMakerAddr, allowanceUnits);

    let contractAllowance: BigNumber = await ruby.allowance(rubyBarAddr, rubyMakerAddr);
    
    let contractAllowanceTokens =  ethers.utils.formatUnits(contractAllowance, 18)

    console.log("RubyMaker allowance tokens: ", contractAllowanceTokens);
    assert(parseInt(contractAllowanceTokens) === allowance);

  };
  
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
  