import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../../utils/network";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { execute, get, getOrNull, log, read, save } = deployments;
  const { deployer } = await getNamedAccounts();

  // Manually check if the pool is already deployed
  const RubyUSD4Pool = await getOrNull("RubyUSD4Pool");
  if (RubyUSD4Pool) {
    log(`reusing "RubyUSD4Pool" at ${RubyUSD4Pool.address}`);
  } else {
    // Constructor arguments

    let TOKEN_ADDRESSES = [];

    const chainId = await getChainId();

    if (chainId === CHAIN_ID.HARDHAT || chainId === CHAIN_ID.LOCALHOST) {
      log('Using Mock Tokens');
      TOKEN_ADDRESSES = [
        (await get("MockUSDP")).address,
        (await get("MockDAI")).address,
        (await get("MockUSDC")).address,
        (await get("MockUSDT")).address,
      ];
    } else {
      log('Using RubyX Tokens on L2');
      TOKEN_ADDRESSES = [
        (await get("RubyUSDP")).address,
        (await get("RubyDAI")).address,
        (await get("RubyUSDC")).address,
        (await get("RubyUSDT")).address,
      ];
    }

    const TOKEN_DECIMALS = [18, 18, 6, 6];
    const LP_TOKEN_NAME = "Ruby USDP/DAI/USDC/USDT";
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
    log(`deployed USD 4 pool (targeting "Swap") at ${usdSwapAddress}`);
    await save("RubyUSD4Pool", {
      abi: (await get("Swap")).abi,
      address: usdSwapAddress,
    });
  }

  const lpTokenAddress = (await read("RubyUSD4Pool", "swapStorage")).lpToken;
  log(`USD 4 pool LP Token at ${lpTokenAddress}`);

  await save("RubyUSD4PoolLPToken", {
    abi: (await get("LPToken")).abi, // LPToken ABI
    address: lpTokenAddress,
  });
};
export default func;
func.tags = ["RubyUSD4Pool", "StableSwap"];
func.dependencies = ["SwapUtils", "SwapDeployer", "Swap"];
