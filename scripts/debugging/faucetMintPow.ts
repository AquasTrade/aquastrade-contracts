import { Provider } from "@ethersproject/abstract-provider";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { RubyToken, RubyDAI, RubyUSDC, RubyUSDP, RubyUSDT, Faucet } from "../../typechain";
import { pow } from "../../utils/faucetPowWeb3";
import Web3 from "web3";
const rubyAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
const usdpAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
const daiAddr = require(`../../deployments/${network.name}/RubyDAI.json`).address;
const usdcAddr = require(`../../deployments/${network.name}/RubyUSDC.json`).address;
const usdtAddr = require(`../../deployments/${network.name}/RubyUSDT.json`).address;
const faucetAddr = require(`../../deployments/${network.name}/Faucet.json`).address;

const main = async () => {
  const [deployer] = await ethers.getSigners();

  const ruby: RubyToken = (await ethers.getContractAt("RubyToken", rubyAddr)) as RubyToken;
  const usdp: RubyUSDP = (await ethers.getContractAt("RubyUSDP", usdpAddr)) as RubyUSDP;
  const usdc: RubyUSDC = (await ethers.getContractAt("RubyUSDC", usdcAddr)) as RubyUSDC;
  const usdt: RubyUSDT = (await ethers.getContractAt("RubyUSDT", usdtAddr)) as RubyUSDT;
  const dai: RubyDAI = (await ethers.getContractAt("RubyDAI", daiAddr)) as RubyDAI;
  let faucet: Faucet = (await ethers.getContractAt("Faucet", faucetAddr)) as Faucet;

  let newWallet = ethers.Wallet.createRandom();
  const newWalletAddress = newWallet.address;

  newWallet = newWallet.connect(deployer.provider as Provider);

  console.log("new wallet PK", newWallet.privateKey);
  console.log("new wallet Address", newWalletAddress);

  const nonce = await newWallet.getTransactionCount();
  const gasEstimate = await faucet.estimateGas.mint(newWalletAddress);
  const gasEstimateNumber = gasEstimate.toNumber();

  let web3 = new Web3("https://dappnet-api.skalenodes.com/v1/melodic-murzim");

  const gasPricePow = pow(gasEstimateNumber, newWalletAddress, nonce, web3);

  const gasPricePowBN = BigNumber.from(gasPricePow);

  const overrides = {
    nonce: nonce,
    gasLimit: gasEstimate,
    gasPrice: gasPricePowBN,
    value: 0,
  };

  faucet = faucet.connect(newWallet);

  const unsignedTx = await faucet.populateTransaction["mint"](newWalletAddress, overrides);
  const signedTx = await newWallet.signTransaction(unsignedTx);
  const res = await newWallet.provider.sendTransaction(signedTx);
  const receipt = await res.wait(1);

  const skEthBalance = (await deployer.provider?.getBalance(newWalletAddress)) as BigNumber;
  const rubyBalance = await ruby.balanceOf(newWalletAddress);
  const usdpBalance = await usdp.balanceOf(newWalletAddress);
  const usdtBalance = await usdt.balanceOf(newWalletAddress);
  const usdcBalance = await usdc.balanceOf(newWalletAddress);
  const daiBalance = await dai.balanceOf(newWalletAddress);

  console.log("Balances minted received:");
  console.log("SKETH: ", ethers.utils.formatUnits(skEthBalance, 18));
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