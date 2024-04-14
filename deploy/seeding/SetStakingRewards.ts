import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, network } = hre;
  const { get } = deployments;

  const RubyStaker = await ethers.getContract("RubyStaker");
  const RubyMaker = await get("RubyMaker");
  const RubyMasterChef = await get("RubyMasterChef");

  let RubyToken;

  if (network.name === "localhost") {
    RubyToken = await get("RubyTokenMainnet");
  } else {
    RubyToken = await get("RubyToken");
  }

  console.log("RubyStaker.setRewardMinter(RubyMasterChef.address)");
  let tx = await RubyStaker.setRewardMinter(RubyMasterChef.address);
  await tx.wait(1);

  console.log("RubyStaker.addReward(RubyToken.address, RubyMaker.address)");
  tx = await RubyStaker.addReward(RubyToken.address, RubyMaker.address);
  await tx.wait(1);
};
export default func;

func.dependencies = ["RubyMasterChef", "RubyStaker", "RubyMaker"];
func.tags = ["SetStakingRewards"];
