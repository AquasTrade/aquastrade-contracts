import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  if (network.name === "europa") {

    await deploy("AquasTradeAirdrop", {
      from: deployer,
      log: true,
      deterministicDeployment: false,
      args: ['0x74f63Fd5F06e2A8B19409e0b3959941276c66f8C'],
      skipIfAlreadyDeployed: false, // Set this to false if you want to deploy regardless
    });

  }
};

func.tags = ["Airdrop"];

export default func;
