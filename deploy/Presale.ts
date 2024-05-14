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

  const stables = [
    '0x5F795bb52dAC3085f578f4877D450e2929D2F13d',
    '0x1c0491E3396AD6a35f061c62387a95d7218FC515',
    '0x73d22d8a2D1f59Bf5Bcf62cA382481a2073FAF58',
    '0xD05C4be5f3be302d376518c9492EC0147Fa5A718'
  ]
  
  const deployedTX = await deploy(`AquasPresale`, {
    from: deployer,
    args: [AQUA_ADDRESS, stables],
    log: true,
  });

  console.log("deploy address ", deployedTX.address)

};


export default func;

func.tags = ["AquasPresale"];



