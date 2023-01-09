/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import l2Artifacts from "../../ima_bridge/l2_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();


const PARTNER_TOKEN_NAME = "SKILL";
const PARTNER_TOKEN_ORIGIN_ADDRESS = "0x5F6E97612482095C0c2C02BC495C0171e61017d7";
const SCHAIN_NAME = "affectionate-immediate-pollux";

const PartnerToken = require(`../../deployments/${network.name}/Europa${PARTNER_TOKEN_NAME}.json`).address;

const registerL2TokensToIMA = async (signer: SignerWithAddress) => {
  const tokenManagerAddress = l2Artifacts.token_manager_erc20_address;
  const tokenManagerABI = l2Artifacts.token_manager_erc20_abi;
  const tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);

  if (typeof PartnerToken !== 'undefined') {
    const res = await tokenManagerContract.addERC20TokenByOwner(SCHAIN_NAME, PARTNER_TOKEN_ORIGIN_ADDRESS, PartnerToken);
    const receipt = await res.wait(1);
    console.log(`Partner Token Address: ${PartnerToken} registered to IMA under Token Name: ${PARTNER_TOKEN_NAME}`, receipt);
  }

};


const main = async () => {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];
  await registerL2TokensToIMA(signer);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
