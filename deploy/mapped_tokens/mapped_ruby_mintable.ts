import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";
import imaL2Artifacts from "../../ima_bridge/l2_artifacts.json";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("RubyTokenMintable", {
    from: deployer,
    args: [],
    log: true,
  });
  // Setup Roles
  // Set roles to token manager
  const tokenContract = await ethers.getContract("RubyTokenMintable");

  const adminRole = await tokenContract.DEFAULT_ADMIN_ROLE();

  console.log("Deployer has DEFAULT_ADMIN_ROLE: ", await tokenContract.hasRole(adminRole, deployer));
};

func.tags = ["RubyTokenMintable"];

export default func;
