import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

console.log(" running deploy_ CoinFlip6 ");

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(" deployer address:", deployer);

  const PayToken = "0xE34A1fEF365876D4D0b55D281618768583ba4867";

  // Deploy your contracts
  const tx = await deploy("coinflip6", {
    from: deployer,
    log: true,
    args: [PayToken],
    skipIfAlreadyDeployed: false, // Set this to false if you want to deploy regardless
  });

 // console.log(tx);
};

deployFunction.tags = ["CoinFlip6"]; // Set the tag for the deployment

export default deployFunction;
