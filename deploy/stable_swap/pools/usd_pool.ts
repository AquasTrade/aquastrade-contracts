import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../../utils/network";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { execute, get, getOrNull, log, read, save } = deployments;
  const { deployer } = await getNamedAccounts();

  // Manually check if the pool is already deployed
  const RubyUSDPool = await getOrNull("RubyUSDPool");
  if (RubyUSDPool) {
    log(`reusing "RubyUSDPool" at ${RubyUSDPool.address}`);
  } else {
    // Constructor arguments

    let TOKEN_ADDRESSES = [];

    const chainId = await getChainId();

    if (chainId === CHAIN_ID.HARDHAT || chainId === CHAIN_ID.LOCALHOST) {
      TOKEN_ADDRESSES = [
        (await get("MockUSDP")).address,
        (await get("MockUSDC")).address,
        (await get("MockUSDT")).address,
      ];
    } else {
      TOKEN_ADDRESSES = [
        (await get("RubyUSDP")).address,
        (await get("RubyUSDC")).address,
        (await get("RubyUSDT")).address,
      ];
    }

    const TOKEN_DECIMALS = [18, 6, 6];
    const LP_TOKEN_NAME = "Ruby USDP/USDC/USDT";
    const LP_TOKEN_SYMBOL = "rubyUSD";
    const INITIAL_A = 200;
    const SWAP_FEE = 4e6; // 4bps
    const ADMIN_FEE = 0;

    const receipt = await execute(
      "SwapDeployer",
      { from: deployer, log: true },
      "deploy",
      (
        await get("Swap")
      ).address,
      TOKEN_ADDRESSES,
      TOKEN_DECIMALS,
      LP_TOKEN_NAME,
      LP_TOKEN_SYMBOL,
      INITIAL_A,
      SWAP_FEE,
      ADMIN_FEE,
      (
        await get("LPToken")
      ).address,
    );

    const newPoolEvent = receipt?.events?.find((e: any) => e["event"] == "NewSwapPool");
    const usdSwapAddress = newPoolEvent["args"]["swapAddress"];
    log(`deployed USD pool (targeting "Swap") at ${usdSwapAddress}`);
    await save("RubyUSDPool", {
      abi: (await get("Swap")).abi,
      address: usdSwapAddress,
    });
  }

  const lpTokenAddress = (await read("RubyUSDPool", "swapStorage")).lpToken;
  log(`USD pool LP Token at ${lpTokenAddress}`);

  await save("RubyUSDPoolLPToken", {
    abi: (await get("LPToken")).abi, // LPToken ABI
    address: lpTokenAddress,
  });
};
export default func;
func.tags = ["USDPool", "StableSwap"];
func.dependencies = ["SwapUtils", "SwapDeployer", "Swap"];
