// npx hardhat run scripts/ownership/ammPairCreator.ts  --network

import { ethers, network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const factoryAddress = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;

const main = async () => {
  const hre = require("hardhat");
  const deployer: SignerWithAddress = (await hre.ethers.getSigners())[0];
  const { management } = await hre.getNamedAccounts();

  const factory = await ethers.getContractAt("UniswapV2Factory", factoryAddress);
  const admin_address = await factory.admin();

  if (admin_address === deployer.address) {
    console.log(`Granting PairCreator permission of UniswapV2Factory:${factoryAddress} -> Address:${management}`);

    const tx = await factory.setPairCreator(management, true);
    await tx.wait(1);

    const is_pair_creator = await factory.pairCreators(management);
    console.log(`Address:${management} is pairCreator:${is_pair_creator}`);
  } else {
    console.error(`Deployer is not admin. admin=${deployer.address}`);
  }
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
