/* eslint no-use-before-define: "warn" */
import { ethers } from "hardhat";
import { bytecode } from "../../artifacts/contracts/amm/UniswapV2Pair.sol/UniswapV2Pair.json";

const main = async () => {
  const initCodeHash = ethers.utils.keccak256(bytecode);
  console.log("initcodehash", initCodeHash);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
