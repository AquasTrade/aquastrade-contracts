/* eslint no-use-before-define: "warn" */
import fs from "fs";
import chalk from "chalk";
import { config, ethers, run, network } from "hardhat";
import { BigNumber, utils } from "ethers";
import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import l2Artifacts from "../../ima_bridge/l2_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

import { MockUSDC, MockUSDP, MockUSDT, MockDAI, RubyTokenMainnet, RubyToken } from "../../typechain";

require("dotenv").config();

import { address as USDC } from "../../deployments/rinkeby/MockUSDC.json";
import { address as USDT} from "../../deployments/rinkeby/MockUSDT.json";
import { address as USDP } from "../../deployments/rinkeby/MockUSDP.json";
import { address as DAI } from "../../deployments/rinkeby/MockDAI.json";
import { address as RubyMainnet } from "../../deployments/rinkeby/RubyTokenMainnet.json";

import { address as rubyUSDC } from "../../deployments/skaleTestnet/RubyUSDC.json";
import { address as rubyUSDT } from "../../deployments/skaleTestnet/RubyUSDT.json";
import { address as rubyUSDP } from "../../deployments/skaleTestnet/RubyUSDP.json";


const bridgeL2tokensToL1 = async (signer: SignerWithAddress) => {
  const tokenManagerAddress = l2Artifacts.token_manager_erc20_address;
  const tokenManagerABI = l2Artifacts.token_manager_erc20_abi;
  const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);

  // console.log("token manager contract", tokenManagerContract)
  // return;

  const rubyUSDCcontract = <MockUSDC>(await ethers.getContractAt("RubyUSDC", rubyUSDC));
  const rubyUSDTcontract = <MockUSDT>(await ethers.getContractAt("RubyUSDT", rubyUSDT));
  const rubyUSDPcontract = <MockUSDP>(await ethers.getContractAt("RubyUSDP", rubyUSDP));

  const amount6 = ethers.utils.parseUnits("100", 6);
  const amount18 = ethers.utils.parseUnits("100", 18);

  let balanceOfRubyUSDCbefore = await rubyUSDCcontract.balanceOf(signer.address);
  let balanceOfRubyUSDTbefore = await rubyUSDTcontract.balanceOf(signer.address);
  let balanceOfRubyUSDPbefore = await rubyUSDPcontract.balanceOf(signer.address);

  // Approvals
  console.log("approvals...");
  console.log("approving rubyUSDC");
  let res = await rubyUSDCcontract.approve(tokenManagerAddress, ethers.utils.parseUnits("1000000", 6));
  await res.wait(1);

  res = await rubyUSDTcontract.approve(tokenManagerAddress, ethers.utils.parseUnits("1000000", 6));
  await res.wait(1);

  res = await rubyUSDPcontract.approve(tokenManagerAddress, ethers.utils.parseUnits("1000000", 18));
  await res.wait(1);

  console.log("bridging...", signer.address, USDC, amount6);

  const usdtAllowance = await rubyUSDTcontract.allowance(signer.address, tokenManagerAddress);

  console.log("Allowance USDT", ethers.utils.formatUnits(usdtAllowance, 6));

  // Bridging
  res = await tokenManagerContract.exitToMainERC20(USDC, amount6);
  await res.wait(1);

  console.log("bridging USDT...");

  res = await tokenManagerContract.exitToMainERC20(USDT, amount6);
  await res.wait(1);

  console.log("bridging USDP...");
  res = await tokenManagerContract.exitToMainERC20(USDP, amount18);
  await res.wait(1);

  let balanceOfRubyUSDCafter = await rubyUSDCcontract.balanceOf(signer.address);
  let balanceOfRubyUSDTafter = await rubyUSDTcontract.balanceOf(signer.address);
  let balanceOfRubyUSDPafter = await rubyUSDPcontract.balanceOf(signer.address);

  // Balance checks
  console.log("Balance checks:");
  console.log(
    `RubyUSDC balance, before: ${ethers.utils.formatUnits(
      balanceOfRubyUSDCbefore,
      6,
    )}, after: ${ethers.utils.formatUnits(balanceOfRubyUSDCafter, 6)}`,
  );
  console.log(
    `RubyUSDT balance, before: ${ethers.utils.formatUnits(
      balanceOfRubyUSDTbefore,
      6,
    )}, after: ${ethers.utils.formatUnits(balanceOfRubyUSDTafter, 6)}`,
  );
  console.log(
    `RubyUSDP balance, before: ${ethers.utils.formatUnits(
      balanceOfRubyUSDPbefore,
      18,
    )}, after: ${ethers.utils.formatUnits(balanceOfRubyUSDPafter, 18)}`,
  );
};

const bridgeL1tokensToL2 = async (signer: SignerWithAddress) => {
  const depositBoxAddress = l1Artifacts.deposit_box_erc20_address;
  const depositBoxABI = l1Artifacts.deposit_box_erc20_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  const USDCcontract = await ethers.getContractAt("MockUSDC", USDC);
  const USDTcontract = await ethers.getContractAt("MockUSDT", USDT);
  const USDPcontract = await ethers.getContractAt("MockUSDP", USDP);
  const DAIcontract = await ethers.getContractAt("MockDAI", DAI);
  const RubyTokenMainnetContract = await ethers.getContractAt("RubyTokenMainnet", RubyMainnet);

  const amountStable6 = ethers.utils.parseUnits("100000000", 6);
  const amountStable18 = ethers.utils.parseUnits("100000000", 18);
  const amountRuby = ethers.utils.parseUnits("150000000", 18);

  let balanceOfUSDCbefore = await USDCcontract.balanceOf(signer.address);
  let balanceOfUSDTbefore = await USDTcontract.balanceOf(signer.address);
  let balanceOfUSDPbefore = await USDPcontract.balanceOf(signer.address);
  let balanceOfDAIbefore = await DAIcontract.balanceOf(signer.address);
  let balanceOfRubyBefore = await RubyTokenMainnetContract.balanceOf(signer.address);

  // Approvals
  if ((await USDCcontract.allowance(signer.address, depositBoxAddress)).lt(amountStable6)) {
    let res = await USDCcontract.approve(depositBoxAddress, amountStable6);
    await res.wait(1);
  }

  if ((await USDTcontract.allowance(signer.address, depositBoxAddress)).lt(amountStable6)) {
    let res = await USDTcontract.approve(depositBoxAddress, amountStable6);
    await res.wait(1);
  }

  if ((await USDPcontract.allowance(signer.address, depositBoxAddress)).lt(amountStable18)) {
    let res = await USDPcontract.approve(depositBoxAddress, amountStable18);
    await res.wait(1);
  }

  if ((await DAIcontract.allowance(signer.address, depositBoxAddress)).lt(amountStable18)) {
    let res = await DAIcontract.approve(depositBoxAddress, amountStable18);
    await res.wait(1);
  }

  if ((await RubyTokenMainnetContract.allowance(signer.address, depositBoxAddress)).lt(amountRuby)) {
    let res = await RubyTokenMainnetContract.approve(depositBoxAddress, amountRuby);
    await res.wait(1);
  }


  // Bridging
  let res = await depositBoxContract.depositERC20(process.env.TESTNET_CHAINNAME, USDC, amountStable6);
  await res.wait(1);

  res = await depositBoxContract.depositERC20(process.env.TESTNET_CHAINNAME, USDT, amountStable6);
  await res.wait(1);

  res = await depositBoxContract.depositERC20(process.env.TESTNET_CHAINNAME, USDP, amountStable18);
  await res.wait(1);

  res = await depositBoxContract.depositERC20(process.env.TESTNET_CHAINNAME, DAI, amountStable18);
  await res.wait(1);

  res = await depositBoxContract.depositERC20(process.env.TESTNET_CHAINNAME, RubyMainnet, amountRuby);
  await res.wait(1);

  let balanceOfUSDCafter = await USDCcontract.balanceOf(signer.address);
  let balanceOfUSDTafter = await USDTcontract.balanceOf(signer.address);
  let balanceOfUSDPafter = await USDPcontract.balanceOf(signer.address);
  let balanceOfDAIafter = await DAIcontract.balanceOf(signer.address);
  let balanceOfRubyAfter = await RubyTokenMainnetContract.balanceOf(signer.address);

  // Balance checks
  console.log("Balance checks:");
  console.log(
    `USDC balance, before: ${ethers.utils.formatUnits(balanceOfUSDCbefore, 6)}, after: ${ethers.utils.formatUnits(
      balanceOfUSDCafter,
      6,
    )}`,
  );
  console.log(
    `USDT balance, before: ${ethers.utils.formatUnits(balanceOfUSDTbefore, 6)}, after: ${ethers.utils.formatUnits(
      balanceOfUSDTafter,
      6,
    )}`,
  );
  console.log(
    `USDP balance, before: ${ethers.utils.formatUnits(balanceOfUSDPbefore, 18)}, after: ${ethers.utils.formatUnits(
      balanceOfUSDPafter,
      18,
    )}`,
  );

  console.log(
    `DAI balance, before: ${ethers.utils.formatUnits(balanceOfDAIbefore, 18)}, after: ${ethers.utils.formatUnits(
      balanceOfDAIafter,
      18,
    )}`,
  );

  console.log(
    `RUBY balance, before: ${ethers.utils.formatUnits(balanceOfRubyBefore, 18)}, after: ${ethers.utils.formatUnits(
      balanceOfRubyAfter,
      18,
    )}`,
  );

};

const main = async () => {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];

  if (network.name === "skaleTestnet") {
    await bridgeL2tokensToL1(signer);
  } else if (network.name === "rinkeby") {
    await bridgeL1tokensToL2(signer);
  }
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
