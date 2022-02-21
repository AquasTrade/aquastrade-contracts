import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { get } = deployments;
  const { deployer } = await getNamedAccounts();

  const UniswapV2Factory = await ethers.getContract("UniswapV2Factory");
  const RubyMaker = await get("RubyMaker");

  let tx = await UniswapV2Factory.setPairCreator(deployer);
  await tx.wait(1);

  tx = await UniswapV2Factory.setFeeTo(RubyMaker.address);
  await tx.wait(1);
};
export default func;

func.dependencies = ["UniswapV2Factory", "RubyMaker"];
func.tags = ["SeedAMM"];
