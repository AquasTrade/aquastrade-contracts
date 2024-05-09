// yarn deploy --network europa --tags AquasDCA
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

//const abi = require('../../abi/contracts/amm/UniswapV2Pair.sol/Uniswapv2Pair.json')


const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();


  console.log("DeployerAddress: :", deployer);

  const USDP_TOKEN_ADDRESS = '0x5F795bb52dAC3085f578f4877D450e2929D2F13d'; // USDC on Skale EuropaHub
  const aquaContract = await ethers.getContract(`AQUA`);
  const AQUA_ADDRESS = aquaContract.address;

  const routerContract = await ethers.getContract(`UniswapV2Router02`);
  const routerAddress = routerContract.address;

  const deployedTX = await deploy(`AquasDCA`, {
    from: deployer,
    args: [deployer, routerAddress, USDP_TOKEN_ADDRESS, AQUA_ADDRESS],
    log: true,
  });

  console.log("deploy address ", deployedTX.address)

  const burnerRole = await aquaContract.BURNER_ROLE();

  if ((await aquaContract.hasRole(burnerRole, deployedTX.address)) === false) {
    const res = await aquaContract.grantRole(burnerRole, deployedTX.address);
    await res.wait(1);
    console.log(`granted AQUA.BURNER_ROLE to DCA Storage@${deployedTX.address}`);
  }

};


export default func;

func.tags = ["AquasDCA"];



