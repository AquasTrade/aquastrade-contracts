/* eslint no-use-before-define: "warn" */
import { ethers,  network } from "hardhat";

import l1Artifacts from "../../ima_bridge/l1_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

require("dotenv").config();


import { address as RubyMainnet } from "../../deployments/rinkeby/RubyTokenMainnet.json";


const bridgeL1tokensToL2 = async (signer: SignerWithAddress) => {
  const depositBoxAddress = l1Artifacts.deposit_box_erc20_address;
  const depositBoxABI = l1Artifacts.deposit_box_erc20_abi;
  const depositBoxContract = new ethers.Contract(depositBoxAddress, depositBoxABI, signer);

  const RubyTokenMainnetContract = await ethers.getContractAt("RubyTokenMainnet", RubyMainnet);

  const amountStable6 = ethers.utils.parseUnits("100000000", 6);
  const amountStable18 = ethers.utils.parseUnits("100000000", 18);
  const amountRuby = ethers.utils.parseUnits("150000000", 18);

  let balanceOfRubyBefore = await RubyTokenMainnetContract.balanceOf(signer.address);

  if ((await RubyTokenMainnetContract.allowance(signer.address, depositBoxAddress)).lt(amountRuby)) {
    let res = await RubyTokenMainnetContract.approve(depositBoxAddress, amountRuby);
    await res.wait(1);
  }

  let res = await depositBoxContract.depositERC20(process.env.TESTNET_CHAINNAME, RubyMainnet, amountRuby);
  await res.wait(1);

  let balanceOfRubyAfter = await RubyTokenMainnetContract.balanceOf(signer.address);

  console.log(
    `RUBY balance, before: ${ethers.utils.formatUnits(balanceOfRubyBefore, 18)}, after: ${ethers.utils.formatUnits(
      balanceOfRubyAfter,
      18,
    )}`,
  );

};

const main = async () => {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];

    await bridgeL1tokensToL2(signer);
  
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });