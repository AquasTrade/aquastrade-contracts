import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, getOrNull, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  let LotteryBurner;

  LotteryBurner = await getOrNull("LotteryBurner");
  const RubyToken = await get("RubyToken");

  if (LotteryBurner) {
    log(`reusing "LotteryBurner" at ${LotteryBurner.address}`);
  } else {
    await deploy("LotteryBurner", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, RubyToken.address],
        },
      },
      skipIfAlreadyDeployed: true,
    });
  }

  LotteryBurner = await get("LotteryBurner");
  const tokenContract = await ethers.getContract("RubyToken");

  const burnerRole = await tokenContract.BURNER_ROLE();
  if ((await tokenContract.hasRole(burnerRole, LotteryBurner.address)) === false) {
    const res = await tokenContract.grantRole(burnerRole, LotteryBurner.address);
    await res.wait(1);
  }

  console.log("LotteryBurner has RUBY BURNER_ROLE:", await tokenContract.hasRole(burnerRole, LotteryBurner.address));

};
export default func;

func.dependencies = ["RubyToken"];
func.tags = ["LotteryBurner", "Lottery"];
