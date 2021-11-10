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

const setMinterRoleForToken = async (tokenAddr, minterAddr) => {
  const token = await ethers.getContractAt("SkaleMappedERC721Token", tokenAddr);
  const MINTER_ROLE = utils.id("MINTER_ROLE");

  let res = await token.grantRole(utils.arrayify(MINTER_ROLE), minterAddr);
  const recipe = await res.wait(1);
  console.log("recipe", recipe);

  res = await token.hasRole(utils.arrayify(MINTER_ROLE), minterAddr);
  console.log("has minter role", res);

  // res = await token.mint(minterAddr, utils.parseUnits("500", 6));
  // await res.wait(1);
  // const balance = await token.balanceOf(minterAddr);
  // console.log("balance", balance);
};

const registerEthereumTokenToIMA = async (artifacts, signer, tokenAddr, schainName) => {
  const depositBoxAddress = artifacts.deposit_box_erc721_address;
  const depositBoxABI = artifacts.deposit_box_erc721_abi;

  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);
  const res = await depositBoxContract.addERC721TokenByOwner(schainName, tokenAddr, { gasLimit: 6500000 });
  const recipe = await res.wait(1);
  console.log("recipe", recipe);
};

const registerSkaleTokenToIma = async (artifacts, signer, ethTokenAddr, skaleTokenAddr) => {
  const tokenManagerAddress = artifacts.token_manager_erc721_address;
  const tokenManagerAbi = artifacts.token_manager_erc721_abi;

  const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerAbi, signer);
  const res = await tokenManagerContract.addERC721TokenByOwner(ethTokenAddr, skaleTokenAddr, { gasLimit: 6500000 });
  const recipe = await res.wait(1);
  console.log("recipe", recipe);
};

const setupT721 = async (ethArtifacts, skaleArtifacts, tokenEthAddr, tokenSkaleAddr, chainName) => {
  const minterAddr = skaleArtifacts.token_manager_erc721_address;

  // TODO: This needs to be split up, because network change is required for the second step
  // console.log("Adding minter role...")
  // await setMinterRoleForToken(tokenSkaleAddr, minterAddr);
  const signer = (await ethers.getSigners())[0];
  // console.log("Registering ETH token to IMA...")
  // await registerEthereumTokenToIMA(ethArtifacts, signer, tokenEthAddr, chainName)
  console.log("Registering Skale token to IMA...");
  await registerSkaleTokenToIma(skaleArtifacts, signer, tokenEthAddr, tokenSkaleAddr);
};

const main = async () => {
  console.log("Setting up t721");
  await setupT721(
    imaAbiRinkeby,
    imaAbiSchain,
    addresses.rinkebyT721,
    addresses.rubyT721,
    process.env.TESTNET_CHAINNAME,
  );
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });