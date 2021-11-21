import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";
import imaL2Artifacts from "../../ima_bridge/l2_artifacts.json";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("RubyToken", {
    from: deployer,
    args: [],
    log: true,
  });

  // Setup Roles
  // Set roles to token manager
  const tokenManagerErc20Address = imaL2Artifacts.token_manager_erc20_address;

  const tokenContract = await ethers.getContract("RubyToken");
  const minterRole = await tokenContract.MINTER_ROLE_IMA();
  const burnerRole = await tokenContract.BURNER_ROLE_IMA();
  const adminRole = await tokenContract.DEFAULT_ADMIN_ROLE();

  if ((await tokenContract.hasRole(minterRole, tokenManagerErc20Address)) === false) {
    let res = await tokenContract.grantRole(minterRole, tokenManagerErc20Address);
    await res.wait(1);
  }

  if ((await tokenContract.hasRole(burnerRole, tokenManagerErc20Address)) === false) {
    let res = await tokenContract.grantRole(burnerRole, tokenManagerErc20Address);
    await res.wait(1);
  }

  // Check roles
  console.log(
    "TokenManagerErc20 has MINTER_ROLE_IMA:",
    await tokenContract.hasRole(minterRole, tokenManagerErc20Address),
  );
  console.log(
    "TokenManagerErc20 has BURNER_ROLE_IMA:",
    await tokenContract.hasRole(burnerRole, tokenManagerErc20Address),
  );
  console.log("Deployer has DEFAULT_ADMIN_ROLE: ", await tokenContract.hasRole(adminRole, deployer));
};

func.tags = ["RubyToken"];

export default func;
