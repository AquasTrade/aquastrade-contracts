/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { BigNumber, utils } from "ethers";
import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import l2Artifacts from "../../ima_bridge/l2_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const checkTimeLimitPerMessage = async () => {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];

  const communityLockerAddress = l2Artifacts.community_locker_address;
  const communityLockerABI = l2Artifacts.community_locker_abi;
  const communityLockerContract = new ethers.Contract(communityLockerAddress, communityLockerABI, signer);
  // console.log("token manager contract", tokenManagerContract)
  const res = await communityLockerContract.timeLimitPerMessage();
  console.log("timeLimitPerMessage: ", res.toString());
};

const setTimeLimitPerMessage = async (timeLimit: BigNumber) => {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];

  const communityLockerAddress = l2Artifacts.community_locker_address;
  const communityLockerABI = l2Artifacts.community_locker_abi;
  const communityLockerContract = new ethers.Contract(communityLockerAddress, communityLockerABI, signer);
  // console.log("token manager contract", tokenManagerContract)
  const res = await communityLockerContract.callStatic.setTimeLimitPerMessage(timeLimit).catch(err => {
    console.log("call static error", err);
  });
  console.log("result", res);
};

const main = async () => {
  await checkTimeLimitPerMessage();
  await setTimeLimitPerMessage(BigNumber.from(0));
};

main();
