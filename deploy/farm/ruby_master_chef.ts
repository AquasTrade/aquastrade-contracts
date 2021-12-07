import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  let RUBY_TOKEN_ADDRESS = ""
  if(network.name === 'localhost') {
    RUBY_TOKEN_ADDRESS = (await get("RubyTokenMintable")).address; // Ruby token address on Localhost
  } else if(network.name === 'skaleTestnet') {
    RUBY_TOKEN_ADDRESS = (await get("RubyToken")).address; // Ruby token address on SChain
  } else {
    throw new Error("Invalid network");
  }

  console.log("RUBY_TOKEN_ADDRESS", RUBY_TOKEN_ADDRESS);

  const { address } = await deploy("RubyMasterChef", {
    from: deployer,
    args: [
      RUBY_TOKEN_ADDRESS,
      treasury,
      "10000000000000000000", // 10 RUBY per sec
      "1638867600", // 	Tue Dec 07 2021 09:00:00 GMT+0000
      "100", // 10%
    ],
    log: true,
    deterministicDeployment: false,
  });
};

func.tags = ["RubyMasterChef"];

export default func;
