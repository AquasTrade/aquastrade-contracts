import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy} = deployments;
  const { deployer } = await getNamedAccounts();

  const address = '0xD2Aaa00700000000000000000000000000000000';// ETHC 
  
    await deploy(`MarketPlace`, {
        contract: "MarketPlace",
        from: deployer,
        args: [address],
        log: true,
        skipIfAlreadyDeployed: true,
      });
  

};
export default func;

//func.dependencies = ["RubyProxyAdmin", "ProfileNFT", "GoldSwapNFT"];
func.tags = ["MarketPlace-ETH"];
