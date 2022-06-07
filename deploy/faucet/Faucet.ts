import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  if (network.name === "europa") {
    await deploy("FaucetRubyEuropa", {
      from: deployer,
      log: true,
      deterministicDeployment: false,
    });
  } else {
    const ruby = (await get("RubyToken")).address;
    const usdp = (await get("RubyUSDP")).address;
    const usdc = (await get("RubyUSDC")).address;
    const usdt = (await get("RubyUSDT")).address;
    const dai = (await get("RubyDAI")).address;

    await deploy("Faucet", {
      from: deployer,
      args: [ruby, usdp, usdc, usdt, dai],
      log: true,
      deterministicDeployment: false,
    });
  }
};

func.tags = ["Faucet"];

export default func;
