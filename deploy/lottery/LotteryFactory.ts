import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const RubyNFTAdmin = await getOrNull("RubyNFTAdmin");
  const LotteryFactory = await getOrNull("LotteryFactory");
  // const RubyToken = await get("RubyToken");
  const RubyToken = await deploy("MockERC20", {
    from: deployer,
    args: ["Mock Token", "Token", "1000000000000000000000000", 18],
    log: true,
    deterministicDeployment: false,
  });
  const RandomNumberGenerator = await get("RandomNumberGenerator");

  if (LotteryFactory) {
    log(`reusing "LotteryFactory" at ${LotteryFactory.address}`);
  } else {
    let contract = await deploy("LotteryFactory", {
      from: deployer,
      log: true,
      proxy: {
        owner: deployer,
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [RubyToken.address, RandomNumberGenerator.address],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }
};
export default func;

func.dependencies = ["RubyProxyAdmin", "RandomNumberGenerator"];
func.tags = ["LotteryFactory", "Lottery"];
