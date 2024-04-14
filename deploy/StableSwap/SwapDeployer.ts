import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
// import { MULTISIG_ADDRESS } from "../../utils/accounts"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("SwapDeployer", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
  });

  // TODO: Set deployer to the multisig in the future

  // const currentOwner = await read("SwapDeployer", "owner")

  //   if (isMainnet(await getChainId()) && currentOwner != MULTISIG_ADDRESS) {
  //     await execute(
  //       "SwapDeployer",
  //       { from: deployer, log: true },
  //       "transferOwnership",
  //       MULTISIG_ADDRESS,
  //     )
  //   }
};
export default func;
func.tags = ["SwapDeployer", "StableSwap"];
