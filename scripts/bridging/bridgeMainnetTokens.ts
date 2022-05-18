/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";

import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();


import { address as RubyMainnet } from "../../deployments/mainnet/RubyTokenMainnet.json";

const SCHAIN_NAME = "elated-tan-skat";


const bridgeEth = async (signer: SignerWithAddress) => {
  const depositBoxAddress = l1Artifacts.deposit_box_eth_address;
  const depositBoxABI = l1Artifacts.deposit_box_eth_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);
  
  let balanceBefore = await ethers.provider.getBalance(signer.address);
  console.log(
    `ETH balance, before: ${ethers.utils.formatEther(balanceBefore)}`)

  // bridge half
  const res = await depositBoxContract.deposit(SCHAIN_NAME, { value: balanceBefore.div(2) });
  await res.wait(1);

  //console.log("ETH bridged")

  let balanceAfter = await ethers.provider.getBalance(signer.address);
  console.log(
    `ETH balance, after: ${ethers.utils.formatEther(balanceAfter.div(2))}`)
}

const bridgeL1tokensToL2 = async (signer: SignerWithAddress) => {
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

const main = async () => {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];

  if (network.name !== "mainnet") {
    throw new Error("Network not supported (these are REAL tokens)");
  }

  console.log("Address:", signer.address);

  await bridgeL1tokensToL2(signer);
  // await bridgeEth(signer);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
