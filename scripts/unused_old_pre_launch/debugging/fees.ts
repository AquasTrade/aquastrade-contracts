/* eslint no-use-before-define: "warn" */
import fs from "fs";
import { ethers, network } from "hardhat";

import { UniswapV2Factory, UniswapV2Pair, RubyToken, RubyStaker, RubyMaker } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { assert } from "console";
import { sign, Sign } from "crypto";
import { BigNumber } from "ethers";

const factoryAddr = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;
const rubyMakerAddr = require(`../../deployments/${network.name}/RubyMaker.json`).address;
const rubyStakerAddr = require(`../../deployments/${network.name}/RubyStaker.json`).address;
const rubyTokenAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
const usdpTokenAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
const ethcAddr = "0xD2Aaa00700000000000000000000000000000000";

const setMakerBurnPercent = async (signer: SignerWithAddress) => {
  const rubyMakerContract: RubyMaker = (await ethers.getContractAt("RubyMaker", rubyMakerAddr)) as RubyMaker;
  let tx = await rubyMakerContract.connect(signer).setBurnPercent(BigNumber.from(0), { gasLimit: 10000000 });
  await tx.wait(1);

  const burnPercent = await rubyMakerContract.burnPercent();

  console.log(`Maker burn percent set! New burn percent: ${burnPercent.toNumber()}`);
};

const setMakerBurnerRole = async (signer: SignerWithAddress) => {
  const rubyTokenContract: RubyToken = (await ethers.getContractAt("RubyToken", rubyTokenAddr)) as RubyToken;

  console.log("ruby token contract supply", ethers.utils.formatUnits(await rubyTokenContract.totalSupply(), 18));

  const burnerRole = await rubyTokenContract.BURNER_ROLE();

  if ((await rubyTokenContract.hasRole(burnerRole, rubyMakerAddr)) === false) {
    let res = await rubyTokenContract.connect(signer).grantRole(burnerRole, rubyMakerAddr);
    await res.wait(1);
    console.log("ruby burner role granted!");
  }
};

const convertMakerFees = async (signer: SignerWithAddress) => {
  const rubyMakerContract: RubyMaker = (await ethers.getContractAt("RubyMaker", rubyMakerAddr)) as RubyMaker;
  const rubyMakerBurnPercent = await rubyMakerContract.burnPercent();
  console.log("rubyMakerBurnPercent", rubyMakerBurnPercent.toNumber());
  // console.log("rubyTokenAddr", rubyTokenAddr)
  // console.log("usdpTokenAddr", usdpTokenAddr)

  // let tx = await rubyMakerContract.connect(signer).convert(rubyTokenAddr, usdpTokenAddr);
  // console.log("tx", tx);
  // await tx.wait(1);

  // console.log("RubyMaker: RUBY - USDP LP converted");

  let tx = await rubyMakerContract.connect(signer).convert(ethcAddr, usdpTokenAddr);
  // console.log("tx", tx)
  const receipt = await tx.wait(1);
  console.log("receipt", receipt);
  console.log("RubyMaker: USDP - ETHC LP converted");
};

const printRubyMakerBalances = async () => {
  // LP ADDRESSES: [usdp/ruby, usdp/ethc]
  const lpAddresses = ["0xC1d7e1043DdCA3D46C67D84238560dD98BaE89ca", "0x29A4F9d3503B7bA5fb8b073E7ADF1e9E62A7555C"];
  for (let lpAddress of lpAddresses) {
    const lpContract: UniswapV2Pair = (await ethers.getContractAt("UniswapV2Pair", lpAddress)) as UniswapV2Pair;
    const balance = await lpContract.balanceOf(rubyMakerAddr);
    const balanceFormatted = ethers.utils.formatUnits(balance, 18);
    console.log(`RubyMaker balance, LP: ${lpAddress}, balance: ${balanceFormatted}`);
  }
};

const printRubyStakerBalances = async () => {
  const rubyTokenContract: RubyToken = (await ethers.getContractAt("RubyToken", rubyTokenAddr)) as RubyToken;
  const rubyStakerContract: RubyStaker = (await ethers.getContractAt("RubyStaker", rubyStakerAddr)) as RubyStaker;
  const balance = await rubyTokenContract.balanceOf(rubyStakerAddr);
  const balanceFormatted = ethers.utils.formatUnits(balance, 18);
  console.log(`RubyStaker  balance: ${balanceFormatted}`);

  const rewardDataId0 = await rubyStakerContract.rewardData(0);
  const rewardDataId1 = await rubyStakerContract.rewardData(1);
  const lockedSupply = await rubyStakerContract.lockedSupply();
  const totalSupply = await rubyStakerContract.totalSupply();
  const rewardDistributor = await rubyStakerContract.rewardDistributors(1, rubyMakerAddr);

  console.log("ruby reward dist", rewardDistributor);
  console.log("lockedSupply", ethers.utils.formatUnits(lockedSupply, 18));
  console.log("totalSupply", ethers.utils.formatUnits(totalSupply, 18));

  console.log("rewardData ID 0:");
  console.log("rewardToken", rewardDataId0.rewardToken);
  console.log("periodFinish", rewardDataId0.periodFinish.toString());
  console.log("rewardRate", ethers.utils.formatUnits(rewardDataId0.rewardRate, 18));
  console.log("rewardPerTokenStored", ethers.utils.formatUnits(rewardDataId0.rewardPerTokenStored, 18));

  console.log("rewardData ID 1:");
  console.log("rewardToken", rewardDataId1.rewardToken);
  console.log("periodFinish", rewardDataId1.periodFinish.toString());
  console.log("rewardRate", ethers.utils.formatUnits(rewardDataId1.rewardRate, 18));
  console.log("rewardPerTokenStored", ethers.utils.formatUnits(rewardDataId1.rewardPerTokenStored, 18));
};

const printBurnedRubyTokens = async () => {
  const rubyTokenContract: RubyToken = (await ethers.getContractAt("RubyToken", rubyTokenAddr)) as RubyToken;
  const balance = await rubyTokenContract.burnedAmount();
  console.log(`Burned RUBY: ${ethers.utils.formatUnits(balance)}`);
};

const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];
  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;

  const feeTo = await factory.feeTo();
  console.log("Fee to: ", feeTo);
  console.log("Ruby maker address: ", rubyMakerAddr);
  assert(feeTo === rubyMakerAddr);

  //   await setMakerBurnPercent(deployer);

  // await setMakerBurnerRole(deployer);

  // await printBurnedRubyTokens();
  await printRubyMakerBalances();
  await printRubyStakerBalances();
  // await convertMakerFees(deployer);
  // await printRubyMakerBalances();
  await printBurnedRubyTokens();
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
