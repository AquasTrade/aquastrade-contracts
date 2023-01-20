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
    'RubyHMT',
  ];

  const length = contract_names.length;

  for (let i = 0; i < length; i++) {

    const token = await get(contract_names[i]);
    const address = token.address;
    const tokenContract = await ethers.getContract(contract_names[i]);
    const symbol = await tokenContract.symbol();

    console.log("Deploying wrapper contract: ", symbol, address)

    await deploy(`Wrap${symbol}`, {
      contract: "SkaleS2SERC20Wrapper",
      from: deployer,
      args: [`Europa Wrapped ${symbol}`, `w${symbol}`, address],
      log: true,
    });

    const contract = await ethers.getContract(`Wrap${symbol}`);

    if (network.name === "rubyNewChain" || network.name === 'europa' || network.name ==='stagingv3' ) {
      const decimals = await contract.decimals();
      console.log("Wrapped token decimals: ", decimals);
      const name = await contract.name();
      console.log("Wrapped token name:", name);
    }

  }

};

func.tags = ["WrapTokens"];

export default func;
