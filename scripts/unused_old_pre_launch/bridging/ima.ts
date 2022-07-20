/* eslint no-use-before-define: "warn" */
import { ethers,  network } from "hardhat";

import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import l2artifacts from "../../ima_bridge/l2_artifacts.json";
import configControllerABI from "../../ima_bridge/configController.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();

const enableAutomaticDeployment = async (signer: SignerWithAddress) => {
  const tokenManagerAddress = l2artifacts.token_manager_erc20_address;
  const tokenManagerABI = l2artifacts.token_manager_erc20_abi;
  const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);

  const tx = await tokenManagerContract.enableAutomaticDeploy();
  const rec = await tx.wait(1);
  console.log("rec", rec);

}

const configController = async (signer: SignerWithAddress) => {
  const configControllerAddress = "0xD2002000000000000000000000000000000000D2";
  const configControllerContract = new ethers.Contract(configControllerAddress, configControllerABI, signer);

  const res = await configControllerContract.enableFreeContractDeployment();
  const rec = await res.wait(1);
  const isEnabled = await configControllerContract.isFCDEnabled();
  console.log("isEnabled", isEnabled)
}

const addChainConnectorRoleSchain = async (signer: SignerWithAddress) => {
  const msgProxyAddr = l2artifacts.message_proxy_chain_address;
  const tokenManagerLinkerAddr = l2artifacts.token_manager_linker_address;
  const msgProxyABI = l2artifacts.message_proxy_chain_abi;
  const msgProxyContract = new ethers.Contract(msgProxyAddr, msgProxyABI, signer);

  let chainConnectorRole = await msgProxyContract.CHAIN_CONNECTOR_ROLE();

  console.log("chainConnectorRole", chainConnectorRole);

  let res = await msgProxyContract.grantRole(chainConnectorRole, tokenManagerLinkerAddr);

  let rec = await res.wait(1);
  console.log("rec", rec);

}


const registerSchain = async (signer: SignerWithAddress) => {
  const msgProxyAddr = l1Artifacts.message_proxy_mainnet_address;
  const msgProxyABI = l1Artifacts.message_proxy_mainnet_abi;
  const msgProxyContract = new ethers.Contract(msgProxyAddr, msgProxyABI, signer);

  let res = await msgProxyContract.addConnectedChain("stocky");
  console.log("res", res)
  const receipt = await res.wait(1);
    console.log("receipt", receipt)

  console.log(`schain registered`);

};

const main = async () => {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];

    // await registerSchain(signer);

    // await configController(signer);
    // await addChainConnectorRoleSchain(signer);
    await enableAutomaticDeployment(signer);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });