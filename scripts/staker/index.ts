// import { ethers, network } from "hardhat";
// import { utils, BigNumber } from "ethers";
// import { RubyMasterChef, UniswapV2Factory, UniswapV2Pair, RubyStaker, RubyToken } from "../../typechain";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

// const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
// const stakerAddr = require(`../../deployments/${network.name}/RubyStaker.json`).address;
// const rubyTokenAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;


// const addReward = async (masterChef: RubyMasterChef, poolId: number, amount: BigNumber) => {
//   const res = await masterChef.deposit(poolId, amount);
//   const receipt = await res.wait(1);

//   // console.log("deposit static call res", res);

//   if (receipt.status) {
//     console.log(`Depositing to RubyMasterChef successful, PoolID: ${poolId}`);
//   } else {
//     console.log(`Depositing to RubyMasterChef failed, PoolID: ${poolId}`);
//   }
// };

// const approve = async (lpAddress: string, ownerAddr: string, amount: BigNumber) => {
//   const lp: UniswapV2Pair = (await ethers.getContractAt("UniswapV2Pair", lpAddress)) as UniswapV2Pair;
//   const allowance = await lp.allowance(ownerAddr, masterChefAddr);
//   if (allowance < amount) {
//     const res = await lp.approve(masterChefAddr, amount);
//     const receipt = await res.wait(1);
//     if (receipt.status) {
//       console.log("Approval successful");
//     }
//   }
// };

// const main = async () => {
//   const deployer: SignerWithAddress = (await ethers.getSigners())[0];
//   const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", masterChefAddr)) as RubyMasterChef;
//   const staker: RubyStaker = (await ethers.getContractAt("RubyStaker", stakerAddr)) as RubyStaker;

//   const poolId = 5; // USDT - USDP pool
//   const lpAddress = "0x6cE9C57Fe5b680F5e132c369715554087dFCec9d";
//   const amount = "0.3";
//   // Lets seed the master chef with more real LPs (stables and ruby)
//   const amountBn = utils.parseUnits(amount, 18);
//   await approve(lpAddress, deployer.address, amountBn);
//   await deposit(masterChef, poolId, amountBn);
// };

// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   });
