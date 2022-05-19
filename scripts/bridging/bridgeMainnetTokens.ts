/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";

import l1Artifacts from "../../ima_bridge/l1_artifacts.mainnet.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();

import { address as RubyMainnet } from "../../deployments/mainnet/RubyTokenMainnet.json";
import l1ERC20Details from "../../deployment_addresses/l1_erc20s.json";

import ERC20Abi from "../../abi/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

const SCHAIN_NAME = "elated-tan-skat";


interface IERC20Props {
  address: string;
  decimals: number
}

interface IERC20Database {
  [key: string]: IERC20Props;
}


const bridgeEth = async (signer: SignerWithAddress) => {
  const depositBoxAddress = l1Artifacts.deposit_box_eth_address;
  const depositBoxABI = l1Artifacts.deposit_box_eth_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);
  
  let balanceBefore = await ethers.provider.getBalance(signer.address);
  console.log(
    `ETH balance, before: ${ethers.utils.formatEther(balanceBefore)}`)

  // bridge 1/5
  const res = await depositBoxContract.deposit(SCHAIN_NAME, { value: balanceBefore.div(5) });
  await res.wait(1);

  let balanceAfter = await ethers.provider.getBalance(signer.address);
  console.log(
    `ETH balance, after: ${ethers.utils.formatEther(balanceAfter)}`)
}

const bridgeL1RubyToL2 = async (signer: SignerWithAddress) => {
  const depositBoxAddress = l1Artifacts.deposit_box_erc20_address;
  const depositBoxABI = l1Artifacts.deposit_box_erc20_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  const RubyTokenMainnetContract = await ethers.getContractAt("RubyTokenMainnet", RubyMainnet);

  const amountRuby = ethers.utils.parseUnits("100", 18);

  let balanceOfRubyBefore = await RubyTokenMainnetContract.balanceOf(signer.address);

  if ((await RubyTokenMainnetContract.allowance(signer.address, depositBoxAddress)).lt(amountRuby)) {
    let res = await RubyTokenMainnetContract.approve(depositBoxAddress, amountRuby);
    await res.wait(1);
  }

  let res = await depositBoxContract.depositERC20(SCHAIN_NAME, RubyMainnet, amountRuby);
  await res.wait(1);

  let balanceOfRubyAfter = await RubyTokenMainnetContract.balanceOf(signer.address);

  console.log(
    `RUBY balance, before: ${ethers.utils.formatUnits(balanceOfRubyBefore, 18)}, after: ${ethers.utils.formatUnits(
      balanceOfRubyAfter,
      18,
    )}`,
  );

};


const bridgeL1TokensToL2 = async (signer: SignerWithAddress, symbol: string) => {
  const depositBoxAddress = l1Artifacts.deposit_box_erc20_address;
  const depositBoxABI = l1Artifacts.deposit_box_erc20_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  const ERC20Details: IERC20Database = <IERC20Database>l1ERC20Details;

  const ERC20address = ERC20Details[symbol].address;
  const ERC20 = new ethers.Contract(ERC20address, ERC20Abi, ethers.provider);
  const ERC20name = await ERC20.symbol();
  const ERC20decimals = await ERC20.decimals();

  let erc20Balance = await ERC20.balanceOf(signer.address);
  const amountToTx = erc20Balance.div(1);

  console.log(`${ERC20name} balance, before: ${ethers.utils.formatUnits(erc20Balance, ERC20decimals)}`);

  if ((await ERC20.allowance(signer.address, depositBoxAddress)).lt(amountToTx)) {
    console.log('need approve');
    // let res = await ERC20.approve(depositBoxAddress, amountToTx);
    // await res.wait(1);
  }

//  let res = await depositBoxContract.depositERC20(SCHAIN_NAME, RubyMainnet, amountToTx);
//  await res.wait(1);

  erc20Balance = await ERC20.balanceOf(signer.address);
  console.log(`${ERC20name} balance, after: ${ethers.utils.formatUnits(erc20Balance, ERC20decimals)}`);

};


const main = async () => {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];

  if (network.name !== "mainnet") {
    throw new Error("Network not supported (these are REAL tokens)");
  }

  console.log("Address:", signer.address);

  // await bridgeL1RubyToL2(signer);
  
  // await bridgeL1TokensToL2(signer, 'USDP');
  // await bridgeL1TokensToL2(signer, 'USDT');
  // await bridgeL1TokensToL2(signer, 'USDC');
  // await bridgeL1TokensToL2(signer, 'DAI');
  // await bridgeL1TokensToL2(signer, 'SKL');
  // await bridgeL1TokensToL2(signer, 'WBTC');

  // await bridgeEth(signer);
  
  let ethBalance = await ethers.provider.getBalance(signer.address);
  console.log(
    `ETH balance: ${ethers.utils.formatEther(ethBalance)}`)

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
