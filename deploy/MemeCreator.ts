// yarn deploy --network europa --tags AquasDCA
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

//const abi = require('../../abi/contracts/amm/UniswapV2Pair.sol/Uniswapv2Pair.json')


const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();


  console.log("DeployerAddress: :", deployer);


  const aquaContract = await ethers.getContract(`AQUA`);
  const AQUA_ADDRESS = aquaContract.address;
  const fContract = await ethers.getContract(`UniswapV2Factory`);
  const routerContract = await ethers.getContract(`UniswapV2Router02`);
  const gContract = await ethers.getContract(`NFTAdmin`);
  const routerAddress = routerContract.address;
  const factoryAddress = fContract.address;
  const nftAddress = gContract.address;

  const deployedTX = await deploy(`MemeCreator`, {
    from: deployer,
    args: [routerAddress, factoryAddress, AQUA_ADDRESS, nftAddress],
    log: true,
  });

  console.log("deploy address ", deployedTX.address)

};


export default func;

func.tags = ["MemeCreator"];

// yarn deploy --network europa --tags MemeCreator   


