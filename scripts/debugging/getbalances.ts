import fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import ERC20Abi from "../../abi/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

interface IERC20Props {
  address: string;
  decimals: number;
}
interface IERC20Database {
  [key: string]: IERC20Props;
}

interface Arguments {
  address: string;
}

const getERC20Balance = async (address: string, symbol: string, hre: HardhatRuntimeEnvironment) => {
  const ethers = hre.ethers;
  const network = hre.network;

  let customName;
  let erc20Addr;
  if (symbol == "RUBY") {
    if (network.name === "mainnet" || network.name === "goerli") {
      erc20Addr = require(`../../deployments/${network.name}/RubyTokenMainnet.json`).address;
    } else {
      erc20Addr = require(`../../deployments/${network.name}/RubyToken.json`).address;
    }
  } else if (symbol == "ETHC") {
    erc20Addr = "0xD2Aaa00700000000000000000000000000000000";
  } else if (symbol == "rubyUSD") {
    erc20Addr = require(`../../deployments/${network.name}/RubyUSD4PoolLPToken.json`).address;
    customName = "4Pool-rubyUSD-LP";
  } else if (symbol.startsWith("usdp")) {
    const pools = JSON.parse(
      fs.readFileSync(`./deployment_addresses/new_pools_addr.${network.name}.json`, { encoding: "utf-8" }),
    );
    erc20Addr = pools[symbol];
    customName = `AMM-${symbol}-RLP`;
  } else {
    let l1DB;
    if (network.name == "mainnet") {
      const ERC20Details: IERC20Database = <IERC20Database>require("../../deployment_addresses/l1_erc20s.json");
      erc20Addr = ERC20Details[symbol].address;
    } else if (network.name == "goerli") {
      const ERC20Details: IERC20Database = <IERC20Database>require("../../deployment_addresses/l1_goerli_erc20s.json");
      erc20Addr = ERC20Details[symbol].address;
    } else {
      erc20Addr = require(`../../deployments/${network.name}/Ruby${symbol}.json`).address;
    }
  }

  const ERC20 = new ethers.Contract(erc20Addr, ERC20Abi, ethers.provider);

  const [ERC20name, ERC20decimals, erc20Balance] = await Promise.all([
    ERC20.symbol(),
    ERC20.decimals(),
    ERC20.balanceOf(address),
  ]);

  console.log(customName || ERC20name, "balance", ethers.utils.formatUnits(erc20Balance, ERC20decimals));
};

const main = async (taskArgs: Arguments, hre: HardhatRuntimeEnvironment) => {
  const ethers = hre.ethers;
  const network = hre.network;
  if (
    network.name === "mainnet" ||
    network.name === "rinkeby" ||
    network.name === "localhost" ||
    network.name === "goerli"
  ) {
    console.log("ETH balance", ethers.utils.formatEther(await ethers.provider.getBalance(taskArgs.address)));
  }
  if (network.name === "rubyNewChain" || network.name === "europa" || network.name === "stagingv3") {
    console.log("sFUEL balance", ethers.utils.formatEther(await ethers.provider.getBalance(taskArgs.address)));
    await getERC20Balance(taskArgs.address, "ETHC", hre);

    try {
      await getERC20Balance(taskArgs.address, "rubyUSD", hre);
    } catch (err) {
      console.log("error: no 4Pool-rubyUSD-LP found");
    }
    try {
      await getERC20Balance(taskArgs.address, "usdpRUBY", hre);
    } catch (err) {
      console.log("error: no AMM-usdpRUBY-RLP found");
    }
  }

  await getERC20Balance(taskArgs.address, "RUBY", hre);

  await getERC20Balance(taskArgs.address, "USDP", hre);
  await getERC20Balance(taskArgs.address, "USDT", hre);
  await getERC20Balance(taskArgs.address, "USDC", hre);
  await getERC20Balance(taskArgs.address, "DAI", hre);
  await getERC20Balance(taskArgs.address, "WBTC", hre);
  await getERC20Balance(taskArgs.address, "SKL", hre);
};

task("balances", "Get balances for relevant tokens etc")
  .addParam("address")
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre);
  });
