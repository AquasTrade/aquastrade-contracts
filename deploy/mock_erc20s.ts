import fs from "fs";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const amount = ethers.utils.parseUnits("1000000", 18);

  let tokenName = "DummyToken";
  let tokenSymbol = "DT";

  const tokenAddresses: string[] = [];

  for (let i = 0; i < 10; i++) {
    const name = `${tokenName}${i}`;
    const symbol = `${tokenSymbol}${i}`;

    const deployRes = await deploy("MockERC20", {
      from: deployer,
      args: [name, symbol, amount, 18],
      log: true,
    });

    tokenAddresses.push(deployRes.address);
    console.log(`Token ${name}, ${symbol}:  ${deployRes.address}`);
  }

  fs.writeFileSync("./utils/mock_erc20_addrs.json", JSON.stringify(tokenAddresses));
};

func.tags = ["MockERC20s"];

export default func;
