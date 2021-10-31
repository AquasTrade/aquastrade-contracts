/* eslint no-use-before-define: "warn" */
import fs from "fs";
import chalk from "chalk";
import { config, ethers, run, network } from "hardhat";
import { BigNumber, utils } from "ethers";
import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import l2Artifacts from "../../ima_bridge/l2_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();

const testCommunityPool = async (signer: SignerWithAddress) => {

  const communityPoolAddress = l1Artifacts.community_pool_address;
  const communityPoolAbi = l1Artifacts.community_pool_abi;

  const communityPoolContract = new ethers.Contract(communityPoolAddress, communityPoolAbi, signer);

  const sChainHash = "0x7cef6e298b91c11477b769ff449417928f4d2bcf03594bb34bbc24ed08d3fdf0";
  const getGasWalletBalance = await communityPoolContract.getBalance(signer.address, process.env.TESTNET_CHAINNAME);
  const isUserActive = await communityPoolContract.activeUsers(signer.address, sChainHash);
  console.log("getGasWalletBalance", ethers.utils.formatUnits(getGasWalletBalance, 18));
  console.log("checkUserBalance", isUserActive);

}


const testEthErc20 = async (signer: SignerWithAddress) => {

  const ethErc20Address = l2Artifacts.eth_erc20_address;
  const ethErc20Abi = l2Artifacts.eth_erc20_abi;

  const ethErc20Contract = new ethers.Contract(ethErc20Address, ethErc20Abi, signer);

  console.log("signer address", signer.address);
  console.log("ethErc20Address", ethErc20Address);
  const balance = await ethErc20Contract.balanceOf(signer.address);
  console.log("balance", ethers.utils.formatUnits(balance, 18));


}
// Todo continue debugging on messages, maybe the mesage encoding is the issue:
// https://github.com/skalenetwork/IMA/blob/develop/proxy/contracts/Messages.sol#L207
const testMessageProxy = async (signer: SignerWithAddress) => {
  const messageProxyAddress = l2Artifacts.message_proxy_chain_address;
  const messageProxyAbi = l2Artifacts.message_proxy_chain_abi;

  const tokenManagerAddress = l2Artifacts.token_manager_eth_address;

  const messageProxyContract = new ethers.Contract(messageProxyAddress, messageProxyAbi, signer);

  const connectedChain = await messageProxyContract.connectedChains("0x8d646f556e5d9d6f1edcf7a39b77f5ac253776eb34efcfd688aacbee518efc26");
  console.log("isConnectedSchain", connectedChain);

  const registryContract = await messageProxyContract.registryContracts(ethers.utils.formatBytes32String(""), tokenManagerAddress);
  console.log("registryContract", registryContract);

  // const mainnetHash = "0x8d646f556e5d9d6f1edcf7a39b77f5ac253776eb34efcfd688aacbee518efc26"
  // const events = messageProxyContract.filters.PostMessageError(null, null);
  // console.log("events", events);
};

const setMessageProxyContractEventListeners = async (signer: SignerWithAddress) => {
  const messageProxyAddress = l2Artifacts.message_proxy_chain_address;
  const messageProxyAbi = l2Artifacts.message_proxy_chain_abi;
  const messageProxyContract = new ethers.Contract(messageProxyAddress, messageProxyAbi, signer);

  messageProxyContract.on("PostMessageError", (msgCounter, message) => {
    console.log("PostMessageError");
    console.log("PostMessageError msgCounter", msgCounter);
    console.log("PostMessageError message", message);
  });

  messageProxyContract.on("OutgoingMessage", (dstChainHash, msgCounter, srcContract, dstContract, data) => {
    console.log("OutgoingMessage");
    console.log("OutgoingMessage dstChainHash", dstChainHash);
    console.log("OutgoingMessage msgCounter", msgCounter);
    console.log("OutgoingMessage srcContract", srcContract);
    console.log("OutgoingMessage dstContract", dstContract);
    console.log("OutgoingMessage data", data);
  });

  console.log("messageProxyContract event listeners set")

}

const testTokenManagerLinker = async (signer: SignerWithAddress) => {
  const tokenManagerLinkerAddress = l2Artifacts.token_manager_linker_address;
  const tokenManagerLinkerAbi = l2Artifacts.token_manager_linker_abi;

  const tokenManagerEthAddress = l2Artifacts.token_manager_eth_address;
  
  const tokenManagerContract = new ethers.Contract(tokenManagerLinkerAddress, tokenManagerLinkerAbi, signer);

  const hasTokenManager = await tokenManagerContract.hasTokenManager(tokenManagerEthAddress);
  console.log("has token manager", hasTokenManager);
}

const testCommunityLocker = async (signer: SignerWithAddress) => {
  const communityLockerAddress = l2Artifacts.community_locker_address;
  const communityLockerABI = l2Artifacts.community_locker_abi;
  const communityLockerContract = new ethers.Contract(communityLockerAddress, communityLockerABI, signer);

  const userActive = await communityLockerContract.activeUsers(signer.address);
  const messageProxy = await communityLockerContract.messageProxy();
  const tokenManagerLinker = await communityLockerContract.tokenManagerLinker();
  const communityPool = await communityLockerContract.communityPool();
  const schainHash = await communityLockerContract.schainHash();
  const timeLimitPerMessage = (await communityLockerContract.timeLimitPerMessage()).toString();

  console.log("userActive", userActive);
  console.log("messageProxy", messageProxy);
  console.log("tokenManagerLinker", tokenManagerLinker);
  console.log("communityPool", communityPool);
  console.log("schainHash", schainHash);
  console.log("timeLimitPerMessage", timeLimitPerMessage);
  
  // const res = await tokenManagerContract.checkAllowedToSendMessage(signer.address);
  // const receipt = await res.wait(1);
  // console.log("allowed to send message recipe", receipt);

}

const testTokenManager = async (signer:SignerWithAddress) => {
  const tokenManagerAddress = l2Artifacts.token_manager_eth_address;
  const tokenManagerABI = l2Artifacts.token_manager_eth_abi;
  const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);

  const code =  await signer?.provider?.getCode(l2Artifacts.token_manager_eth_address)
  console.log("bytecode", code);

  const ethErc20 = await tokenManagerContract.ethErc20();
  const messageProxy = await tokenManagerContract.messageProxy();
  const tokenManagerLinker = await tokenManagerContract.tokenManagerLinker();
  const communityLocker = await tokenManagerContract.communityLocker();
  const schainHash = await tokenManagerContract.schainHash();
  const depositBox = await tokenManagerContract.depositBox();
  const automaticDeploy = await tokenManagerContract.automaticDeploy();
  const hasTokenManager = await tokenManagerContract.hasTokenManager(process.env.TESTNET_CHAINNAME);
  const mainnetHash = await tokenManagerContract.MAINNET_HASH();

  console.log("ethErc20", ethErc20);
  console.log("messageProxy", messageProxy);
  console.log("tokenManagerLinker", tokenManagerLinker);
  console.log("communityLocker", communityLocker);
  console.log("schainHash", schainHash);
  console.log("depositBox", depositBox);
  console.log("automaticDeploy", automaticDeploy);
  console.log("hasTokenManager", hasTokenManager);
  console.log("mainnetHash", mainnetHash);

}

const testCalls = async (signer: SignerWithAddress) => {
  // await testTokenManager(signer);
  // await testCommunityLocker(signer);
  // await testTokenManagerLinker(signer);
  await testMessageProxy(signer);
  // await testEthErc20(signer);

}

const bridgeETHtoSkale = async (signer: SignerWithAddress, amount: BigNumber, chainName: string) => {

    const depositBoxABI = l1Artifacts.deposit_box_eth_abi;
    const depositBoxAddress = l1Artifacts.deposit_box_eth_address;
    const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);
    const res = await depositBoxContract.deposit(chainName, { value: amount, gasLimit: 15000000 });
    const receipt = await res.wait(1);
    console.log("receipt", receipt);

}

const bridgeETHfromSkale = async (signer: SignerWithAddress, amount: BigNumber) => {

    console.log("Bridging ETH from Skale");
    const tokenManagerAddress = l2Artifacts.token_manager_eth_address;
    const tokenManagerABI = l2Artifacts.token_manager_eth_abi;
    const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);
    const res = await tokenManagerContract.exitToMain(amount, { gasLimit: 8000000, gasPrice: 100000000000 });
    const receipt = await res.wait(1);
    console.log("receipt", receipt);

    // const decodedHash = tokenManagerContract.interface.decodeFunctionData("exitToMain", "0xeeeb9601000000000000000000000000000000000000000000000000002386f26fc10000");
    // console.log("Decoded hash", decodedHash.amount.toString());

}


const main = async () => {


  const signer: SignerWithAddress = (await ethers.getSigners())[0];
  const ethAmount = utils.parseUnits("0.00", 18);
  
  // await testCommunityPool(signer);
  await testCalls(signer);
  // setMessageProxyContractEventListeners(signer);
  // if(network.name === 'skaleTestnet') {
  //     console.log("bridging from skale..", signer.address);
  //   await bridgeETHfromSkale(signer, ethAmount)    
  // } else {
  //   console.log("bridging to skale..", signer.address);
  //   await bridgeETHtoSkale(signer, ethAmount, <string>process.env.TESTNET_CHAINNAME);    
  // }
};

main()
  .then(() => console.log("main finished"))
  .catch(error => {
    console.error(error);
    // process.exit(1);
  });

// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   });
