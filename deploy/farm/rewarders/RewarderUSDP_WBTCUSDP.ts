import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const CHEF_ADDRESS = (await get("RubyMasterChef")).address;
  const USDP_TOKEN_ADDRESS = (await get("RubyUSDP")).address;
  const TOKEN_PER_SECOND = 0;
  const WBTCUSDP_POOL = require(`../../../deployment_addresses/new_pools_addr.${network.name}.json`).usdpWBTC;

  await deploy("RewarderUSDP_WBTCUSDP", {
    contract: "SimpleRewarderPerSec",
    from: deployer,
    args: [USDP_TOKEN_ADDRESS, WBTCUSDP_POOL, TOKEN_PER_SECOND, CHEF_ADDRESS],
    log: true,
    deterministicDeployment: false,
  });
};
func.tags = ["RewarderUSDP_WBTCUSDP", "DualRewardRewarders"];
func.dependencies = ["RubyMasterChef", "RubyUSDP"];

export default func;
