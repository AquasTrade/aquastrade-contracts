
/* eslint no-use-before-define: "warn" */
import fs from "fs";
import chalk from "chalk";
import { config, ethers, run, network } from "hardhat";
import { BigNumber, utils } from "ethers";
import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import l2Artifacts from "../../ima_bridge/l2_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

import {MockUSDC, MockUSDP, MockUSDT} from "../../typechain"

require("dotenv").config();

import {address as USDC, abi as abiUSDC} from "../../deployments/rinkeby/MockUSDC.json"
import {address as USDT, abi as abiUSDT} from "../../deployments/rinkeby/MockUSDT.json"
import {address as USDP, abi as abiUSDP} from "../../deployments/rinkeby/MockUSDP.json"


import {address as rubyUSDC, abi as abiRubyUSDC} from "../../deployments/skaleTestnet/RubyUSDC.json"
import {address as rubyUSDT, abi as abiRubyUSDT} from "../../deployments/skaleTestnet/RubyUSDT.json"
import {address as rubyUSDP, abi as abiRubyUSDP} from "../../deployments/skaleTestnet/RubyUSDP.json"




const bridgeL2tokensToL1 = async (signer: SignerWithAddress) => {

    const tokenManagerAddress = l2Artifacts.token_manager_erc20_address;
    const tokenManagerABI = l2Artifacts.token_manager_erc20_abi;
    const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);


    const rubyUSDCcontract = <MockUSDC>new ethers.Contract(rubyUSDC, abiRubyUSDC, signer);
    const rubyUSDTcontract = <MockUSDT>new ethers.Contract(rubyUSDT, abiRubyUSDT, signer);
    const rubyUSDPcontract = <MockUSDP>new ethers.Contract(rubyUSDP, abiRubyUSDP, signer);

    const amount6 = ethers.utils.parseUnits("100", 6);
    const amount18 = ethers.utils.parseUnits("100", 18);

    let balanceOfRubyUSDCbefore = await rubyUSDCcontract.balanceOf(signer.address);
    let balanceOfRubyUSDTbefore = await rubyUSDTcontract.balanceOf(signer.address);
    let balanceOfRubyUSDPbefore = await rubyUSDPcontract.balanceOf(signer.address);

    // Approvals
    console.log("approvals...")
    if((await rubyUSDCcontract.allowance(signer.address, tokenManagerAddress)).lt(amount6)) {
        let res = await rubyUSDCcontract.approve(tokenManagerAddress, amount6);
        await res.wait(1);
    }

    if((await rubyUSDTcontract.allowance(signer.address, tokenManagerAddress)).lt(amount6)) {
        let res = await rubyUSDTcontract.approve(tokenManagerAddress, amount6);
        await res.wait(1);
    }
    if((await rubyUSDPcontract.allowance(signer.address, tokenManagerAddress)).lt(amount18)) {
        let res = await rubyUSDPcontract.approve(tokenManagerAddress, amount18);
        await res.wait(1);
    }

    console.log("bridging...")


    // Bridging
    let res = await tokenManagerContract.exitToMainERC20(USDC, amount6);
    await res.wait(1);

    console.log("bridging USDT...")

    res = await tokenManagerContract.exitToMainERC20(USDT, amount6);
    await res.wait(1);

    console.log("bridging USDP...")
    res = await tokenManagerContract.exitToMainERC20(USDP, amount18);
    await res.wait(1);

    let balanceOfRubyUSDCafter = await rubyUSDCcontract.balanceOf(signer.address);
    let balanceOfRubyUSDTafter = await rubyUSDTcontract.balanceOf(signer.address);
    let balanceOfRubyUSDPafter = await rubyUSDPcontract.balanceOf(signer.address);

    // Balance checks
    console.log("Balance checks:")
    console.log(`RubyUSDC balance, before: ${ethers.utils.formatUnits(balanceOfRubyUSDCbefore, 6)}, after: ${ethers.utils.formatUnits(balanceOfRubyUSDCafter, 6)}`)
    console.log(`RubyUSDT balance, before: ${ethers.utils.formatUnits(balanceOfRubyUSDTbefore, 6)}, after: ${ethers.utils.formatUnits(balanceOfRubyUSDTafter, 6)}`)
    console.log(`RubyUSDP balance, before: ${ethers.utils.formatUnits(balanceOfRubyUSDPbefore, 18)}, after: ${ethers.utils.formatUnits(balanceOfRubyUSDPafter, 18)}`)

}

const bridgeL1tokensToL2 = async (signer: SignerWithAddress) => {

    const depositBoxAddress = l1Artifacts.deposit_box_erc20_address;
    const depositBoxABI = l1Artifacts.deposit_box_erc20_abi;
    const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

    const USDCcontract = <MockUSDC>new ethers.Contract(USDC, abiUSDC, signer);
    const USDTcontract = <MockUSDT>new ethers.Contract(USDT, abiUSDT, signer);
    const USDPcontract = <MockUSDP>new ethers.Contract(USDP, abiUSDP, signer);

    const amount6 = ethers.utils.parseUnits("100", 6);
    const amount18 = ethers.utils.parseUnits("100", 18);

    let balanceOfUSDCbefore = await USDCcontract.balanceOf(signer.address);
    let balanceOfUSDTbefore = await USDTcontract.balanceOf(signer.address);
    let balanceOfUSDPbefore = await USDPcontract.balanceOf(signer.address);

    // Approvals
    if((await USDCcontract.allowance(signer.address, depositBoxAddress)).lt(amount6)) {
        let res = await USDCcontract.approve(depositBoxAddress, amount6);
        await res.wait(1);
    }

    if((await USDTcontract.allowance(signer.address, depositBoxAddress)).lt(amount6)) {
        let res = await USDTcontract.approve(depositBoxAddress, amount6);
        await res.wait(1);
    }
    if((await USDPcontract.allowance(signer.address, depositBoxAddress)).lt(amount18)) {
        let res = await USDPcontract.approve(depositBoxAddress, amount18);
        await res.wait(1);
    }

    // Bridging
    let res = await depositBoxContract.depositERC20(process.env.TESTNET_CHAINNAME, USDC, amount6);
    await res.wait(1);

    res = await depositBoxContract.depositERC20(process.env.TESTNET_CHAINNAME, USDT, amount6);
    await res.wait(1);

    res = await depositBoxContract.depositERC20(process.env.TESTNET_CHAINNAME, USDP, amount18);
    await res.wait(1);

    let balanceOfUSDCafter = await USDCcontract.balanceOf(signer.address);
    let balanceOfUSDTafter = await USDTcontract.balanceOf(signer.address);
    let balanceOfUSDPafter = await USDPcontract.balanceOf(signer.address);

    // Balance checks
    console.log("Balance checks:")
    console.log(`USDC balance, before: ${ethers.utils.formatUnits(balanceOfUSDCbefore, 6)}, after: ${ethers.utils.formatUnits(balanceOfUSDCafter, 6)}`)
    console.log(`USDT balance, before: ${ethers.utils.formatUnits(balanceOfUSDTbefore, 6)}, after: ${ethers.utils.formatUnits(balanceOfUSDTafter, 6)}`)
    console.log(`USDP balance, before: ${ethers.utils.formatUnits(balanceOfUSDPbefore, 18)}, after: ${ethers.utils.formatUnits(balanceOfUSDPafter, 18)}`)

}


const main = async () => {

    const signer: SignerWithAddress = (await ethers.getSigners())[0];
   
    if(network.name === 'skaleTestnet') {
        await bridgeL2tokensToL1(signer);
    } else if(network.name === 'rinkeby') {
        await bridgeL1tokensToL2(signer);
    }
  };

  main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
