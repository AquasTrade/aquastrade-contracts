import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../utils/network";

const MERKLE_ROOT = {
  [CHAIN_ID.HARDHAT]: "0xca0f8c7ee1addcc5fce6a7c989ba3f210db065c36c276b71b8c8253a339318a3",
  [CHAIN_ID.LOCALHOST]: "0xca0f8c7ee1addcc5fce6a7c989ba3f210db065c36c276b71b8c8253a339318a3",
  [CHAIN_ID.SKALE_MAINNET]: "",
  [CHAIN_ID.SKALE_TESTCHAIN]: "0xca0f8c7ee1addcc5fce6a7c989ba3f210db065c36c276b71b8c8253a339318a3",
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Allowlist", {
    from: deployer,
    args: [MERKLE_ROOT[await getChainId()]],
    log: true,
    skipIfAlreadyDeployed: true,
  });
};
export default func;
func.tags = ["Allowlist", "StableSwap"];
