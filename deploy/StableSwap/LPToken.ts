import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const lpToken = await getOrNull("LPToken");
  if (lpToken) {
    log(`reusing "LPToken" at ${lpToken.address}`);
  } else {
    await deploy("LPToken", {
      from: deployer,
      log: true,
      skipIfAlreadyDeployed: true,
    });

    await execute(
      "LPToken",
      { from: deployer, log: true },
      "initialize",
      "Ruby LP Token (Target)",
      "rubyLPTokenTarget",
    );
  }
};
export default func;
func.tags = ["LPToken", "StableSwap"];
