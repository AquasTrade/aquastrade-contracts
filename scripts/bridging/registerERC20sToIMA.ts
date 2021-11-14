
/* eslint no-use-before-define: "warn" */
import fs from "fs";
import chalk from "chalk";
import { config, ethers, run, network } from "hardhat";
import { BigNumber, utils } from "ethers";
import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import l2Artifacts from "../../ima_bridge/l2_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();

import {address as USDC} from "../../deployments/rinkeby/MockUSDC.json"
import {address as USDT} from "../../deployments/rinkeby/MockUSDT.json"
import {address as USDP} from "../../deployments/rinkeby/MockUSDP.json"
import {address as RubyMainnet} from "../../deployments/rinkeby/RubyTokenMainnet.json"


import {address as rubyUSDC} from "../../deployments/skaleTestnet/RubyUSDC.json"
import {address as rubyUSDT} from "../../deployments/skaleTestnet/RubyUSDT.json"
import {address as rubyUSDP} from "../../deployments/skaleTestnet/RubyUSDP.json"
import {address as Ruby} from "../../deployments/skaleTestnet/RubyToken.json"




const registerL2TokensToIMA = async (signer: SignerWithAddress) => {

    const tokenManagerAddress = l2Artifacts.token_manager_erc20_address;
    const tokenManagerABI = l2Artifacts.token_manager_erc20_abi;
    const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);

    console.log("tokenManagerContract", tokenManagerContract);

    let res = await tokenManagerContract.addERC20TokenByOwner(USDC, rubyUSDC);
    await res.wait(1);
    res = await tokenManagerContract.addERC20TokenByOwner(USDT, rubyUSDT);
    await res.wait(1);
    res = await tokenManagerContract.addERC20TokenByOwner(USDP, rubyUSDP);
    await res.wait(1);

    res = await tokenManagerContract.addERC20TokenByOwner(RubyMainnet, Ruby);
    await res.wait(1);
    
    
    const rubyUSDCaddress = await tokenManagerContract.clonesErc20(USDC);
    const rubyUSDTaddress = await tokenManagerContract.clonesErc20(USDT);
    const rubyUSDPaddress = await tokenManagerContract.clonesErc20(USDP);
    const rubyAddress = await tokenManagerContract.clonesErc20(RubyMainnet);

    console.log("TokenManager registered tokens: ")
    console.log(`RubyUSDC, original: ${rubyUSDC}, registered: ${rubyUSDCaddress}`)
    console.log(`RubyUSDT, original: ${rubyUSDT}, registered: ${rubyUSDTaddress}`)
    console.log(`RubyUSDP, original: ${rubyUSDP}, registered: ${rubyUSDPaddress}`)
    console.log(`Ruby, original: ${Ruby}, registered: ${rubyAddress}`)

}

const registerL1TokensToIMA = async (signer: SignerWithAddress) => {


    const depositBoxAddress = l1Artifacts.deposit_box_erc20_address;
    const depositBoxABI = l1Artifacts.deposit_box_erc20_abi;
    const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

    let res = await depositBoxContract.addERC20TokenByOwner(process.env.TESTNET_CHAINNAME, USDC);
    await res.wait(1);
    res = await depositBoxContract.addERC20TokenByOwner(process.env.TESTNET_CHAINNAME, USDT);
    await res.wait(1);
    res = await depositBoxContract.addERC20TokenByOwner(process.env.TESTNET_CHAINNAME, USDP);
    await res.wait(1);

    res = await depositBoxContract.addERC20TokenByOwner(process.env.TESTNET_CHAINNAME, RubyMainnet);
    await res.wait(1);

    const sChainHash = "0x7cef6e298b91c11477b769ff449417928f4d2bcf03594bb34bbc24ed08d3fdf0"

    const registeredUSDCaddress = await depositBoxContract.schainToERC20(sChainHash, USDC);
    const registeredUSDTaddress = await depositBoxContract.schainToERC20(sChainHash, USDT);
    const registeredUSDPaddress = await depositBoxContract.schainToERC20(sChainHash, USDP);
    const registeredRubyAddress = await depositBoxContract.schainToERC20(sChainHash, RubyMainnet);

    console.log("Deposit box registered tokens: ")
    console.log(`RubyUSDC, original: ${USDC}, registered: ${registeredUSDCaddress}`)
    console.log(`RubyUSDT, original: ${USDT}, registered: ${registeredUSDTaddress}`)
    console.log(`RubyUSDP, original: ${USDP}, registered: ${registeredUSDPaddress}`)
    console.log(`Ruby, original: ${RubyMainnet}, registered: ${registeredRubyAddress}`)
}


const main = async () => {

    const signer: SignerWithAddress = (await ethers.getSigners())[0];
   
    if(network.name === 'skaleTestnet') {
        await registerL2TokensToIMA(signer);
    } else if(network.name === 'rinkeby') {
        await registerL1TokensToIMA(signer);
    }
  };

  main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
