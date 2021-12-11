import { ethers, network } from "hardhat";
import { utils, BigNumber } from "ethers";
import { RubyMasterChef, UniswapV2Factory, UniswapV2Pair } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
const factoryAddr = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;

// const rubyAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
// const usdcAddr = require(`../../deployments/${network.name}/USDC.json`).address;
// const usdtAddr = require(`../../deployments/${network.name}/USDT.json`).address;
// const usdpAddr = require(`../../deployments/${network.name}/USDP.json`).address;
// const wethAddr = require(`../../deployments/${network.name}/WETH.json`).address;

const deposit = async (masterChef: RubyMasterChef, poolId: number, amount: BigNumber) => {
  const res = await masterChef.deposit(poolId, amount);
  const receipt = await res.wait(1);

  // console.log("deposit static call res", res);

  if (receipt.status) {
    console.log(`Depositing to RubyMasterChef successful, PoolID: ${poolId}`);
  } else {
    console.log(`Depositing to RubyMasterChef failed, PoolID: ${poolId}`);
  }
};

const approve = async (lpAddress: string, ownerAddr: string, amount: BigNumber) => {
  const lp: UniswapV2Pair = (await ethers.getContractAt("UniswapV2Pair", lpAddress)) as UniswapV2Pair;
  const allowance = await lp.allowance(ownerAddr, masterChefAddr);
  if (allowance < amount) {
    const res = await lp.approve(masterChefAddr, amount);
    const receipt = await res.wait(1);
    if (receipt.status) {
      console.log("Approval successful");
    }
  }
};

const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];
  const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", masterChefAddr)) as RubyMasterChef;
  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", factoryAddr)) as UniswapV2Factory;

  const poolId = 5; // USDT - USDP pool
  const lpAddress = "0x6cE9C57Fe5b680F5e132c369715554087dFCec9d";
  const amount = "0.3";
  // Lets seed the master chef with more real LPs (stables and ruby)
  const amountBn = utils.parseUnits(amount, 18);
  await approve(lpAddress, deployer.address, amountBn);
  await deposit(masterChef, poolId, amountBn);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
