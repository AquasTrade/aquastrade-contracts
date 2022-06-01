import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import ERC20Abi from "../../abi/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

interface Arguments {
  address: string,
}


const getERC20Balance = async (address: string, symbol: string, hre: HardhatRuntimeEnvironment) => {
  const ethers = hre.ethers;
  const network = hre.network;

  let erc20Addr;
  if (symbol == 'RUBY') {
    erc20Addr = require(`../../deployments/${network.name}/RubyToken.json`).address;
  } else if (symbol == 'ETHC' ) {
    erc20Addr = '0xD2Aaa00700000000000000000000000000000000';
  } else {
    erc20Addr = require(`../../deployments/${network.name}/Ruby${symbol}.json`).address;
  }

  const ERC20 = new ethers.Contract(erc20Addr, ERC20Abi, ethers.provider);
  const ERC20name = await ERC20.symbol();
  const ERC20decimals = await ERC20.decimals();
  const erc20Balance = await ERC20.balanceOf(address);

  console.log(ERC20name, "balance", ethers.utils.formatUnits(erc20Balance, ERC20decimals))
}


const main = async (taskArgs: Arguments, hre: HardhatRuntimeEnvironment) => {
  const ethers = hre.ethers;
  const network = hre.network;
  if (network.name === 'mainnet' || network.name === 'rinkeby' || network.name === 'localhost') {
    console.log('ETH balance', ethers.utils.formatEther(await ethers.provider.getBalance(taskArgs.address)));
  } else {
    console.log('sFUEL balance', ethers.utils.formatEther(await ethers.provider.getBalance(taskArgs.address)));
    await getERC20Balance(taskArgs.address, 'ETHC', hre)
    await getERC20Balance(taskArgs.address, 'USDP', hre)
    await getERC20Balance(taskArgs.address, 'USDT', hre)
    await getERC20Balance(taskArgs.address, 'USDC', hre)
    await getERC20Balance(taskArgs.address, 'DAI', hre)
    await getERC20Balance(taskArgs.address, 'RUBY', hre)
    await getERC20Balance(taskArgs.address, 'WBTC', hre)
    await getERC20Balance(taskArgs.address, 'SKL', hre)
  }
};

task("balances", "Get balances for relevant tokens etc")
  .addParam("address")
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre);
  });
