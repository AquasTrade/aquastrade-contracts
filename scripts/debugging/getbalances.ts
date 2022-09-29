import fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import ERC20Abi from "../../abi/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

import L1_ERC20_DB from "../../deployment_addresses/l1_erc20s.json";
interface IERC20Props {
  address: string;
  decimals: number
};
interface IERC20Database {
  [key: string]: IERC20Props;
};
const ERC20Details: IERC20Database = <IERC20Database>L1_ERC20_DB;


interface Arguments {
  address: string,
}


const getERC20Balance = async (address: string, symbol: string, hre: HardhatRuntimeEnvironment) => {
  const ethers = hre.ethers;
  const network = hre.network;

  let erc20Addr;
  if (symbol == 'RUBY') {
    if (network.name === 'mainnet') {
      erc20Addr = require(`../../deployments/${network.name}/RubyTokenMainnet.json`).address;    
    } else {
      erc20Addr = require(`../../deployments/${network.name}/RubyToken.json`).address;
    }
  } else if (symbol == 'ETHC' ) {
    erc20Addr = '0xD2Aaa00700000000000000000000000000000000';
  } else if (symbol == 'rubyUSD') {
    erc20Addr = require(`../../deployments/${network.name}/RubyUSD4PoolLPToken.json`).address;
  } else if (symbol.startsWith('usdp')) {
    const pools = JSON.parse(fs.readFileSync(`./deployment_addresses/new_pools_addr.${network.name}.json`, {encoding: "utf-8"}));
    erc20Addr = pools[symbol];
  } else {
    if (network.name == 'mainnet') {
      erc20Addr = ERC20Details[symbol].address;
    } else {
      erc20Addr = require(`../../deployments/${network.name}/Ruby${symbol}.json`).address;
    }
  }

  const ERC20 = new ethers.Contract(erc20Addr, ERC20Abi, ethers.provider);

  const [ERC20name, ERC20decimals, erc20Balance] = await Promise.all([
    ERC20.symbol(),
    ERC20.decimals(),
    ERC20.balanceOf(address)]);

  console.log(ERC20name, "balance", ethers.utils.formatUnits(erc20Balance, ERC20decimals))
}


const main = async (taskArgs: Arguments, hre: HardhatRuntimeEnvironment) => {
  const ethers = hre.ethers;
  const network = hre.network;
  if (network.name === 'mainnet' || network.name === 'rinkeby' || network.name === 'localhost') {
    console.log('ETH balance', ethers.utils.formatEther(await ethers.provider.getBalance(taskArgs.address)));
  }
  if (network.name === 'rubyNewChain' || network.name == 'europa') {
    console.log('sFUEL balance', ethers.utils.formatEther(await ethers.provider.getBalance(taskArgs.address)));
    await getERC20Balance(taskArgs.address, 'ETHC', hre)

    await getERC20Balance(taskArgs.address, 'rubyUSD', hre)
    await getERC20Balance(taskArgs.address, 'usdpRUBY', hre)
  }

  await getERC20Balance(taskArgs.address, 'RUBY', hre)

  await getERC20Balance(taskArgs.address, 'USDP', hre)
  await getERC20Balance(taskArgs.address, 'USDT', hre)
  await getERC20Balance(taskArgs.address, 'USDC', hre)
  await getERC20Balance(taskArgs.address, 'DAI', hre)
  await getERC20Balance(taskArgs.address, 'WBTC', hre)
  await getERC20Balance(taskArgs.address, 'SKL', hre)

};

task("balances", "Get balances for relevant tokens etc")
  .addParam("address")
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre);
  });
