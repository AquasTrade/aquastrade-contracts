import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";


const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const CHEF_ADDRESS = (await get("RubyMasterChef")).address;
  const SKL_TOKEN_ADDRESS = (await get("RubySKL")).address;
  const TOKEN_PER_SECOND = ethers.utils.parseUnits("1", 18);
  const RUBYUSDP_POOL = require(`../../../deployment_addresses/new_pools_addr.${network.name}.json`).usdpRUBY;

  await deploy("RewarderSKL_RUBYUSDP", {
    contract: "SimpleRewarderPerSec",
    from: deployer,
    args: [
      SKL_TOKEN_ADDRESS,
      RUBYUSDP_POOL,
      TOKEN_PER_SECOND,
      CHEF_ADDRESS
    ],
    log: true,
    deterministicDeployment: false,
  });

};
func.tags = ["RewarderSKL_RUBYUSDP"];
func.dependencies = ["RubyMasterChef", "RubySKL"];

export default func;
