/* eslint no-use-before-define: "warn" */
import { ethers,  network } from "hardhat";

import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();


import { address as RubyMainnet } from "../../deployments/rinkeby/RubyTokenMainnet.json";
import { address as RinkebyDAI } from "../../deployments/rinkeby/MockDAI.json";
import { address as RinkebyUSDC } from "../../deployments/rinkeby/MockUSDC.json";
import { address as RinkebyUSDP } from "../../deployments/rinkeby/MockUSDP.json";
import { address as RinkebyUSDT } from "../../deployments/rinkeby/MockUSDT.json";


const bridgeEth = async (signer: SignerWithAddress) => {
  const depositBoxAddress = l1Artifacts.deposit_box_eth_address;
  const depositBoxABI = l1Artifacts.deposit_box_eth_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);
  const res = await depositBoxContract.deposit("fancy-rasalhague", { value: ethers.utils.parseUnits("0.5", 18), gasLimit: 6500000 });
  await res.wait(1);
  console.log("eth bridged")
}

const bridgeL1tokensToL2 = async (signer: SignerWithAddress) => {
  const depositBoxAddress = l1Artifacts.deposit_box_erc20_address;
  const depositBoxABI = l1Artifacts.deposit_box_erc20_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  const RubyTokenMainnetContract = await ethers.getContractAt("RubyTokenMainnet", RubyMainnet);
  const daiRinkeby = await ethers.getContractAt("MockDAI", RinkebyDAI);
  const usdcRinkeby = await ethers.getContractAt("MockUSDC", RinkebyUSDC);
  const usdpRinkeby = await ethers.getContractAt("MockUSDP", RinkebyUSDP);
  const usdtRinkeby = await ethers.getContractAt("MockUSDT", RinkebyUSDT);

  const amountStable6 = ethers.utils.parseUnits("100000000", 6);
  const amountStable18 = ethers.utils.parseUnits("100000000", 18);
  const amountRuby = ethers.utils.parseUnits("150000000", 18);

  let balanceOfRubyBefore = await RubyTokenMainnetContract.balanceOf(signer.address);
  let balanceOfDaiBefore = await daiRinkeby.balanceOf(signer.address);
  let balanceOfUsdcBefore = await usdcRinkeby.balanceOf(signer.address);
  let balanceOfUsdpBefore = await usdpRinkeby.balanceOf(signer.address);
  let balanceOfUsdtBefore = await usdtRinkeby.balanceOf(signer.address);

  // if ((await RubyTokenMainnetContract.allowance(signer.address, depositBoxAddress)).lt(amountRuby)) {
  //   let res = await RubyTokenMainnetContract.approve(depositBoxAddress, amountRuby);
  //   await res.wait(1);
  // }

  if ((await daiRinkeby.allowance(signer.address, depositBoxAddress)).lt(amountStable18)) {
    let res = await daiRinkeby.approve(depositBoxAddress, amountStable18);
    await res.wait(1);
  }

  if ((await usdcRinkeby.allowance(signer.address, depositBoxAddress)).lt(amountStable6)) {
    let res = await usdcRinkeby.approve(depositBoxAddress, amountStable6);
    await res.wait(1);
  }

  if ((await usdpRinkeby.allowance(signer.address, depositBoxAddress)).lt(amountStable18)) {
    let res = await usdpRinkeby.approve(depositBoxAddress, amountStable18);
    await res.wait(1);
  }

  if ((await usdtRinkeby.allowance(signer.address, depositBoxAddress)).lt(amountStable6)) {
    let res = await usdtRinkeby.approve(depositBoxAddress, amountStable6);
    await res.wait(1);
  }

  // let res = await depositBoxContract.depositERC20("fancy-rasalhague", RubyMainnet, amountRuby);
  // await res.wait(1);

  let res = await depositBoxContract.depositERC20("fancy-rasalhague", daiRinkeby.address, amountStable18);
  await res.wait(1);

  res = await depositBoxContract.depositERC20("fancy-rasalhague", usdcRinkeby.address, amountStable6);
  await res.wait(1);

  res = await depositBoxContract.depositERC20("fancy-rasalhague", usdpRinkeby.address, amountStable18);
  await res.wait(1);

  res = await depositBoxContract.depositERC20("fancy-rasalhague", usdtRinkeby.address, amountStable6);
  await res.wait(1);

  // let balanceOfRubyAfter = await RubyTokenMainnetContract.balanceOf(signer.address);
  let balanceOfDaiAfter = await daiRinkeby.balanceOf(signer.address);
  let balanceOfUsdcAfter = await usdcRinkeby.balanceOf(signer.address);
  let balanceOfUsdpAfter = await usdpRinkeby.balanceOf(signer.address);
  let balanceOfUsdtAfter = await usdtRinkeby.balanceOf(signer.address);

  // console.log(
  //   `RUBY balance, before: ${ethers.utils.formatUnits(balanceOfRubyBefore, 18)}, after: ${ethers.utils.formatUnits(
  //     balanceOfRubyAfter,
  //     18,
  //   )}`,
  // );

  console.log(
    `DAI balance, before: ${ethers.utils.formatUnits(balanceOfDaiBefore, 18)}, after: ${ethers.utils.formatUnits(
      balanceOfDaiAfter,
      18,
    )}`,
  );

  console.log(
    `USDC balance, before: ${ethers.utils.formatUnits(balanceOfUsdcBefore, 18)}, after: ${ethers.utils.formatUnits(
      balanceOfUsdcAfter,
      6,
    )}`,
  );

  console.log(
    `USDP balance, before: ${ethers.utils.formatUnits(balanceOfUsdpBefore, 18)}, after: ${ethers.utils.formatUnits(
      balanceOfUsdpAfter,
      18,
    )}`,
  );

  console.log(
    `USDT balance, before: ${ethers.utils.formatUnits(balanceOfUsdtBefore, 18)}, after: ${ethers.utils.formatUnits(
      balanceOfUsdtAfter,
      6,
    )}`,
  );

};

const main = async () => {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];

    // await bridgeL1tokensToL2(signer);
  await bridgeEth(signer);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });