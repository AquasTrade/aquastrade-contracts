import { ethers, network } from "hardhat";
import { utils, BigNumber } from "ethers";
import { RubyMasterChef, UniswapV2Factory, UniswapV2Pair, RubyToken } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
const rubyTokenAddress = require(`../../deployments/${network.name}/RubyToken.json`).address;
const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];
  const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", masterChefAddr)) as RubyMasterChef;
  const rubyToken =  (await ethers.getContractAt("RubyToken", rubyTokenAddress)) as RubyToken;
  const balanceOfMasterChef  = await rubyToken.balanceOf(masterChefAddr);

  await masterChef.emergencyWithdrawRubyTokens(deployer.address, balanceOfMasterChef);

  const balanceOfMasterChefFormatted  = ethers.utils.formatUnits(await rubyToken.balanceOf(masterChefAddr), 18);


  console.log("new masterchef balance", balanceOfMasterChefFormatted);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
