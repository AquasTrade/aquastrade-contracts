import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

console.log(" running deploy_ CoinFlip6 ");

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, getOrNull } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(" deployer address:", deployer);

  const PayToken = "0xE34A1fEF365876D4D0b55D281618768583ba4867";

  const RNG = await getOrNull("RNG_CoinFlip");

  if (!RNG) {
    // Deploy your contracts
    await deploy("RNG_CoinFlip", {
      from: deployer,
      log: true,
      args: [],
      skipIfAlreadyDeployed: true, // Set this to false if you want to deploy regardless
    });
  }

  if (RNG) {
    // Deploy your contracts
    await deploy("CoinFlip", {
      from: deployer,
      log: true,
      args: [PayToken, RNG.address],
      skipIfAlreadyDeployed: false, // Set this to false if you want to deploy regardless
    });
  }

  // console.log(tx);
};

deployFunction.tags = ["CoinFlip", "RNG"]; // Set the tag for the deployment

export default deployFunction;
