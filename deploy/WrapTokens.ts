import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const contract_names = [
    'RubyDAI',
    'RubyUSDC',
    'RubyUSDP',
    'RubyUSDT',
    'RubySKL',
    'RubyWBTC',
    'RubyToken',
  ];

  const length = contract_names.length;

  for (let i = 0; i < length; i++) {

    const token = await get(contract_names[i]);

    const address = token.address;

    const tokenContract = await ethers.getContract(contract_names[i]);

    const symbol = await tokenContract.symbol();

    console.log("Testing contracts: ", symbol, address)

    await deploy(`Wrap${symbol}`, {
      contract: "SkaleS2SERC20Wrapper",
      from: deployer,
      args: [`Europa Wrapped ${symbol}`, `w${symbol}`, address],
      log: true,
    });

    const contract = await ethers.getContract(`Wrap${symbol}`);

    if (network.name === "rubyNewChain" || network.name === 'europa') {
      const decimals = await contract.decimals();
      console.log("Wrapped Token decimals: ", decimals);
      const name = await contract.name();
      console.log("Wrapped Token Name:", name);
    }

  }

};

func.tags = ["WrapTokens"];

export default func;
