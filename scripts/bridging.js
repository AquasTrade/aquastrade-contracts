/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, tenderly, run } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");
const imaRinkebyArtifacts = require('../ima_bridge/rinkeby/rinkebyABI.json')
const rinkebyUSDCArtifacts = require('../ima_bridge/rinkeby/rinkebyUSDC.json')
const rinkebytERC20Artifacts = require('../ima_bridge/rinkeby/rinkebyTERC20.json')
const rinkebyT721Artifacts = require('../ima_bridge/rinkeby/rinkebyT721.json')
require('dotenv').config()



const bridgeETHfromEthereumToSkale = async  (artifacts, signer, amount, chainName) => {

  console.log("Bridging ETH to Skale")
  const depositBoxAddress = artifacts.deposit_box_eth_address;
  const depositBoxABI = artifacts.deposit_box_eth_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);
  const res = await depositBoxContract.deposit(chainName, signer.address, {value:amount, gasLimit: 6500000});
  const recipe = await res.wait(1);
  console.log("recipe", recipe);

}

const bridgeERC20fromEthereumToSkale = async  (imaArtifacts, tokenArtifacts, signer, amount, chainName) => {

  console.log("Bridging ERC20 to Skale")
  const depositBoxAddress = imaArtifacts.deposit_box_erc20_address;
  const depositBoxABI = imaArtifacts.deposit_box_erc20_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  const erc20Address = tokenArtifacts.address;
  const erc20ABI = tokenArtifacts.abi;
  const erc20Contract = new ethers.Contract(erc20Address, erc20ABI, signer);

  let res = await erc20Contract.approve(depositBoxAddress, amount);
  let recipe = await res.wait(1);
  console.log("approval recipe", recipe);

  res = await depositBoxContract.depositERC20(chainName, erc20Address, signer.address, amount, {gasLimit: 6500000});
  recipe = await res.wait(1);
  console.log("deposit recipe", recipe);

}


const bridgeERC721fromEthereumToSkale = async  (imaArtifacts, tokenArtifacts, signer, tokenId, chainName) => {

  console.log("Bridging ERC721 to Skale")
  const depositBoxAddress = imaArtifacts.deposit_box_erc721_address;
  const depositBoxABI = imaArtifacts.deposit_box_erc721_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  const erc721Address = tokenArtifacts.address;
  const erc721ABI = tokenArtifacts.abi;
  const erc721Contract = new ethers.Contract(erc721Address, erc721ABI, signer);

  let res = await erc721Contract.approve(depositBoxAddress, tokenId);
  let recipe = await res.wait(1);
  console.log("approval recipe", recipe);

  res = await depositBoxContract.depositERC721(chainName, erc721Address, signer.address, tokenId, {gasLimit: 6500000});
  recipe = await res.wait(1);
  console.log("deposit recipe", recipe);

}

const main = async () => {

  const signer = (await ethers.getSigners())[0];
  // const ethAmount = utils.parseUnits("0.01", 18);
  // await bridgeETHfromEthereumToSkale(imaRinkebyArtifacts, signer, ethAmount, process.env.TESTNET_CHAINNAME);

  // const usdcAmount = utils.parseUnits("100", 6);
  // await bridgeERC20fromEthereumToSkale(imaRinkebyArtifacts, rinkebyUSDCArtifacts, signer, usdcAmount, process.env.TESTNET_CHAINNAME);
  //
  // const tokenId = ethers.BigNumber.from(1);
  // await bridgeERC721fromEthereumToSkale(imaRinkebyArtifacts, rinkebyT721Artifacts, signer, tokenId, process.env.TESTNET_CHAINNAME);

  const terc20Amount = utils.parseUnits("100", 18);
  await bridgeERC20fromEthereumToSkale(imaRinkebyArtifacts, rinkebytERC20Artifacts, signer, terc20Amount, process.env.TESTNET_CHAINNAME);


};


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
