import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();


  // const { address } = 
  await deploy("Timelock", {
    from: deployer,
    args: [
      deployer,
      "43200", // 12 hours = 60*60*12 = 43200
    ],
    log: true,
    deterministicDeployment: false,
    gasLimit: 4000000,
  });

  // if ((await chef.owner()) !== address) {
  //   // Transfer RubyMasterChef Ownership to timelock
  //   console.log("Transfer RubyMasterChef Ownership to timelock");
  //   await (await chef.transferOwnership(address)).wait();
  // }
};

func.tags = ["Timelock"];
func.dependencies = ["RubyMasterChef"];

export default func;
