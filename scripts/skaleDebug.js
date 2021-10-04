/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, tenderly, run } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");
const imaAbiRinkeby = require("../ima_bridge/rinkeby/rinkebyABI.json");
const imaAbiSchain = require("../ima_bridge/rinkeby/sChainABI.json");

const { getAddresses } = require("../utils/addresses");

const addresses = getAddresses();
//

const toggleAutomaticDeployments = async tokenManagerContract => {
  let automaticDeploy = await tokenManagerContract.automaticDeploy();
  console.log("automatic deploy enabled", automaticDeploy);
  let res;
  if (automaticDeploy) {
    console.log("disabling automatic deployments");
    res = await tokenManagerContract.disableAutomaticDeploy();
  } else {
    console.log("enabling automatic deployments");
    res = await tokenManagerContract.enableAutomaticDeploy();
  }
  console.log("res", res);

  const receipt = await res.wait(1);
  console.log("receipt", receipt);

  automaticDeploy = await tokenManagerContract.automaticDeploy();
  console.log("automatic deploy status", automaticDeploy);
};

const registerEthereumTokenToIMA = async (artifacts, signer, tokenAddr, schainName) => {
  const depositBoxAddress = artifacts.deposit_box_erc20_address;
  const depositBoxABI = artifacts.deposit_box_erc20_abi;

  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);
  const res = await depositBoxContract.addERC20TokenByOwner(schainName, tokenAddr);
  const recipe = await res.wait(1);
  console.log("recipe", recipe);
};

const getSchainTokenFromMainnetToken = async (artifacts, signer, tokenAddr) => {
  const tokenManagerAddress = artifacts.token_manager_erc20_address;
  const tokenManagerAbi = artifacts.token_manager_erc20_abi;
  const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerAbi, signer);
  const schainTokenAddr = await tokenManagerContract.clonesErc20(tokenAddr);
  console.log("schain token addr", schainTokenAddr);
};

const toggleERC20AutomaticDeployments = async (artifacts, signer) => {
  const tokenManagerAddress = artifacts.token_manager_erc20_address;
  const tokenManagerAbi = artifacts.token_manager_erc20_abi;
  const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerAbi, signer);
  await toggleAutomaticDeployments(tokenManagerContract);
};

const main = async () => {
  const signer = (await ethers.getSigners())[0];
  await toggleERC20AutomaticDeployments(imaAbiSchain, signer);
  // await getSchainTokenFromMainnetToken(imaAbiSchain, signer, addresses.rinkebyTERC20)

  // await registerEthereumTokenToIMA(imaAbiRinkeby, signer, addresses.rinkebyTERC20, process.env.TESTNET_CHAINNAME)
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
