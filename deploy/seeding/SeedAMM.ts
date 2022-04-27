import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { get } = deployments;
  const { deployer } = await getNamedAccounts();

  const UniswapV2Factory = await ethers.getContract("UniswapV2Factory");
  const RubyMaker = await get("RubyMaker");
  const UniswapV2Router02 = await get("UniswapV2Router02");

  let tx = await UniswapV2Factory.setPairCreator(deployer, true);
  await tx.wait(1);

  tx = await UniswapV2Factory.setFeeDeductionSwapper(UniswapV2Router02.address, true);
  await tx.wait(1);

  tx = await UniswapV2Factory.setFeeTo(RubyMaker.address);
  await tx.wait(1);

  const feeTo = await UniswapV2Factory.feeTo();
  console.log("fee to", feeTo);

};
export default func;

func.dependencies = ["UniswapV2Router02", "RubyMaker"];
func.tags = ["SeedAMM"];
