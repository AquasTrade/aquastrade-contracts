import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { RubyToken, RubyDAI, RubyUSDC, RubyUSDP, RubyUSDT } from "../../typechain";

const rubyAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
const usdpAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
const daiAddr = require(`../../deployments/${network.name}/RubyDAI.json`).address;
const usdcAddr = require(`../../deployments/${network.name}/RubyUSDC.json`).address;
const usdtAddr = require(`../../deployments/${network.name}/RubyUSDT.json`).address;

// for testing or giving test tokens to people, just write and address here and change
// the amounts
const faucetAddr = require(`../../deployments/${network.name}/Faucet.json`).address;

const main = async () => {
  const [deployer] = await ethers.getSigners();

  const ruby: RubyToken = (await ethers.getContractAt("RubyToken", rubyAddr)) as RubyToken;
  const usdp: RubyUSDP = (await ethers.getContractAt("RubyUSDP", usdpAddr)) as RubyUSDP;
  const usdc: RubyUSDC = (await ethers.getContractAt("RubyUSDC", usdcAddr)) as RubyUSDC;
  const usdt: RubyUSDT = (await ethers.getContractAt("RubyUSDT", usdtAddr)) as RubyUSDT;
  const dai: RubyDAI = (await ethers.getContractAt("RubyDAI", daiAddr)) as RubyDAI;

  const transferAmount18 = ethers.utils.parseUnits("1000", 18);
  const transferAmountEth = ethers.utils.parseUnits("100", 18);  // Gas = Eth = sFUEL
  const transferAmount6 = ethers.utils.parseUnits("1000", 6);

  let res = await ruby.transfer(faucetAddr, transferAmount18);
  await res.wait(1);
  res = await usdp.transfer(faucetAddr, transferAmount18);
  await res.wait(1);
  res = await dai.transfer(faucetAddr, transferAmount18);
  await res.wait(1);
  res = await usdc.transfer(faucetAddr, transferAmount6);
  await res.wait(1);
  res = await usdt.transfer(faucetAddr, transferAmount6);

  res = await deployer.sendTransaction({
    to: faucetAddr,
    value: transferAmountEth,
  });

  await res.wait(1);

  const sFuelBalance = (await deployer.provider?.getBalance(faucetAddr)) as BigNumber;
  const rubyBalance = await ruby.balanceOf(faucetAddr);
  const usdpBalance = await usdp.balanceOf(faucetAddr);
  const usdtBalance = await usdt.balanceOf(faucetAddr);
  const usdcBalance = await usdc.balanceOf(faucetAddr);
  const daiBalance = await dai.balanceOf(faucetAddr);

  console.log("Faucet seeded successfully, balances:");
  console.log("sFUEL: ", ethers.utils.formatUnits(sFuelBalance, 18));
  console.log("RUBY: ", ethers.utils.formatUnits(rubyBalance, 18));
  console.log("USDP: ", ethers.utils.formatUnits(usdpBalance, 18));
  console.log("DAI: ", ethers.utils.formatUnits(daiBalance, 18));
  console.log("USDC: ", ethers.utils.formatUnits(usdcBalance, 6));
  console.log("USDT: ", ethers.utils.formatUnits(usdtBalance, 6));
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
