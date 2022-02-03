import { ethers, network } from "hardhat";
import { utils, BigNumber } from "ethers";
import { RubyMasterChef, UniswapV2Factory, UniswapV2Pair } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;

// const rubyAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
// const usdcAddr = require(`../../deployments/${network.name}/USDC.json`).address;
// const usdtAddr = require(`../../deployments/${network.name}/USDT.json`).address;
// const usdpAddr = require(`../../deployments/${network.name}/USDP.json`).address;
// const wethAddr = require(`../../deployments/${network.name}/WETH.json`).address;

const debug = async (masterChef: RubyMasterChef) => {
  const treasuryAddress = await masterChef.treasuryAddr();
  const rubyStakerAddress = await masterChef.rubyStaker();
  const rubyAddress = await masterChef.RUBY();
  const rubyPerSec = await masterChef.rubyPerSec();
  const treasuryPercent = await masterChef.treasuryPercent();
  const totalAllocPoint = await masterChef.totalAllocPoint();
  const poolLength = (await masterChef.poolLength() as BigNumber).toNumber();

  console.log("treasuryAddress", treasuryAddress);
  console.log("rubyStakerAddress", rubyStakerAddress);
  console.log("rubyAddress", rubyAddress);
  console.log("rubyPerSec", ethers.utils.formatUnits(rubyPerSec, 18));
  console.log("treasuryPercent", treasuryPercent.toNumber());
  console.log("totalAllocPoint", totalAllocPoint.toNumber());
  console.log("poolLength", poolLength);

  for (let i = 0; i < poolLength; i++) {
    const poolInfo = await masterChef.poolInfo(i);

    console.log(`MasterChefPoolInfo id: ${i}`, poolInfo)
  }

};


const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];
  const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", masterChefAddr)) as RubyMasterChef;

    await debug(masterChef);

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
