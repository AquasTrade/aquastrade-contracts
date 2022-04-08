/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import l2Artifacts from "../../ima_bridge/l2_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();

import { address as RubyMainnet } from "../../deployments/rinkeby/RubyTokenMainnet.json";
import { address as RinkebyDAI } from "../../deployments/rinkeby/MockDAI.json";
import { address as RinkebyUSDC } from "../../deployments/rinkeby/MockUSDC.json";
import { address as RinkebyUSDP } from "../../deployments/rinkeby/MockUSDP.json";
import { address as RinkebyUSDT } from "../../deployments/rinkeby/MockUSDT.json";

import { address as RubyUSDC } from "../../deployments/rubyNewChain/RubyUSDC.json";
import { address as RubyUSDT } from "../../deployments/rubyNewChain/RubyUSDT.json";
import { address as RubyDAI } from "../../deployments/rubyNewChain/RubyDAI.json";
import { address as RubyUSDP } from "../../deployments/rubyNewChain/RubyUSDP.json";

import { address as RubyUSDC2 } from "../../deployments/testSchainv2/RubyUSDC.json";


const registerL2TokensToIMA = async (signer: SignerWithAddress) => {
  const tokenManagerAddress = l2Artifacts.token_manager_erc20_address;
  const tokenManagerABI = l2Artifacts.token_manager_erc20_abi;
  const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);

  // let clone = await tokenManagerContract.clonesErc20("0x0785b4b9847b9ce0ef0b85f78d36ac3cd5dee447b0e156cfbf4e84bfad2973a6", RubyDAI);

  // console.log("clone addr", clone)

  // console.log("registering to new chain...")
  // let res = await tokenManagerContract.addERC20TokenByOwner("Mainnet", RubyMainnet, Ruby);
  // const receipt = await res.wait(1);
  // console.log("receipt", receipt);

  // let res = await tokenManagerContract.addERC20TokenByOwner("Mainnet", RinkebyDAI, RubyDAI);
  // await res.wait(1);

  // let res = await tokenManagerContract.addERC20TokenByOwner("fancy-rasalhague", RubyUSDC, RubyUSDC2);
  // // console.log("Res", res)
  // await res.wait(1);

  let res = await tokenManagerContract.callStatic.addERC20TokenByOwner("whispering-turais", RubyUSDC2, RubyUSDC);
  // console.log("Res", res)
  await res.wait(1);
  // res = await tokenManagerContract.addERC20TokenByOwner("Mainnet", RinkebyUSDP, RubyUSDP);
  // await res.wait(1);

  // res = await tokenManagerContract.addERC20TokenByOwner("Mainnet", RinkebyUSDT, RubyUSDT);
  // await res.wait(1);

  // const rubyAddress = await tokenManagerContract.clonesErc20("fancy-rasalhague", RubyMainnet);


  // console.log("TokenManager registered tokens: ");
  // console.log(`Ruby, original: ${Ruby}, registered: ${rubyAddress}`);
};

const registerL1TokensToIMA = async (signer: SignerWithAddress) => {
  const depositBoxAddress = l1Artifacts.deposit_box_erc20_address;
  const depositBoxABI = l1Artifacts.deposit_box_erc20_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  const rubyExists = await depositBoxContract.getSchainToERC20("fancy-rasalhague", RubyMainnet);

  let res;

  // if (!rubyExists) {
  //   console.log("Registering RUBY...");
  //   res = await depositBoxContract.addERC20TokenByOwner("fancy-rasalhague", RubyMainnet);
  //   await res.wait(1);
  // }


  console.log("Registering USDC...");
  res = await depositBoxContract.addERC20TokenByOwner("fancy-rasalhague", RinkebyUSDC);
  await res.wait(1);

  console.log("Registering DAI...");
  res = await depositBoxContract.addERC20TokenByOwner("fancy-rasalhague", RinkebyDAI);
  await res.wait(1);

  console.log("Registering USDP...");
  res = await depositBoxContract.addERC20TokenByOwner("fancy-rasalhague", RinkebyUSDP);
  await res.wait(1);

  console.log("Registering USDT...");
  res = await depositBoxContract.addERC20TokenByOwner("fancy-rasalhague", RinkebyUSDT);
  await res.wait(1);

  // const sChainHash = "0x7cef6e298b91c11477b769ff449417928f4d2bcf03594bb34bbc24ed08d3fdf0";
  // const registeredRubyAddress = await depositBoxContract.getSchainToERC20("fancy-rasalhague", RubyMainnet);

  console.log("Deposit box registered tokens: ");
  // console.log(`Ruby, original: ${RubyMainnet}, registered: ${registeredRubyAddress}`);
};

const main = async () => {
  // console.log("process argv", process.argv);

  const signer: SignerWithAddress = (await ethers.getSigners())[0];

  if (network.name === "skaleTestnet" || network.name === "rubyNewChain" || network.name === "testSchainv2" ) {
    await registerL2TokensToIMA(signer);
  } else if (network.name === "rinkeby") {
    await registerL1TokensToIMA(signer);
  }
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });