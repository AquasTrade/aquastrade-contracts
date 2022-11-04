import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("WrapETHC", {
    contract: "SkaleS2SERC20Wrapper",
    from: deployer,
    args: ["ETHWrap", "WETH", "0xD2Aaa00700000000000000000000000000000000"],
    log: true,
  });

  const tokenContract = await ethers.getContract("WrapETHC");

  // decimals() falls back to underlying which 
  if (network.name === "rubyNewChain" || network.name === 'europa') {
    const decimals = await tokenContract.decimals();
    console.log("WETH decimals: ", decimals);
  } else {
    console.error("WARNING: Predeployed ETH at '0xD2Aaa00700000000000000000000000000000000' is only valid on Skale")
  }

  const name = await tokenContract.name();
  console.log("WETH name: ", name);
  
};

func.tags = ["WrapETHC"];

export default func;
