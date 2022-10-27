/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import { UniswapV2Factory, UniswapV2Router02} from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import fs from "fs";

import { debugPairs } from "../utils";

const ROUTER_ADDR = require(`../../deployments/${network.name}/UniswapV2Router02.json`).address;
const FACTORY_ADDR = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;
const usdpAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;
const erc20_abi = require(`../../deployments/${network.name}/RubyUSDP.json`).abi;

// if false, deploy the amm pool
const TESTING = true;

// ADJUST Token name
const tokenName = "SKILL";
const partnerAddr = require(`../../deployments/${network.name}/Europa${tokenName}.json`).address;

// one Partner Token required
// input USDP amount 
const USDP_AMOUNT = "0.05";// Pool Price is 2x of USDP_AMOUNT

const addLiquidity = async (
  tokenA: string,
  tokenB: string,
  amountTokenA: BigNumber,
  amountTokenB: BigNumber,
  to: string,
  deadline: BigNumber,
) => {

  const router: UniswapV2Router02 = (await ethers.getContractAt("UniswapV2Router02", ROUTER_ADDR)) as UniswapV2Router02;
  const res = await router.addLiquidity(
    tokenA,
    tokenB,
    amountTokenA,
    amountTokenB,
    ethers.constants.Zero,
    ethers.constants.Zero,
    to,
    deadline,
  )

  //  console.log("res", res)
  const receipt = await res.wait(1);

  if (receipt.status) {
    console.log(`Liquidity added successfully for tokens: ${tokenA}, ${tokenB}`);
  } else {
    console.log(`Could not add liquidity for tokens: ${tokenA}, ${tokenB}`);
  }
};


const approveTokens = async (tokens: any[], routerAddr: string, amount: BigNumber) => {
  for (const token of tokens) {
    const symbol = await token.symbol();
    const decimals = await token.decimals();

    console.log(`Aproving ${routerAddr} to spend ${symbol} token... for ${ethers.utils.formatUnits(amount, decimals)}`);

    const res = await token.approve(routerAddr, amount);
    await res.wait(1);
  }
  console.log("Tokens approved!");
};

const main = async () => {
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", FACTORY_ADDR)) as UniswapV2Factory;

  const create_pool = await factory.pairCreators(deployer.address)

  //ACCESS GRANTED
  if (create_pool === true) {

    const usdp = new ethers.Contract(usdpAddr, erc20_abi, deployer);
    const partner = new ethers.Contract(partnerAddr, erc20_abi, deployer);

    console.log("Creating new AMM Pool with | ", usdp.address, partner.address);

    const usdpDecimals = await usdp.decimals();
    const partnerDecimals = await partner.decimals();

    const partnerSymbol = await partner.symbol();

    if (typeof usdpDecimals === 'undefined' || typeof partnerDecimals === 'undefined') {
      console.log("Token Data missing");
      return;
    }


    const pool_exist = await factory.getPair(usdp.address, partner.address);

    // Pool doesn't exist
    if (pool_exist === '0x0000000000000000000000000000000000000000') {

      const amountPARTNER = ethers.utils.parseUnits("1", partnerDecimals);
      const amountUSDPPARTNER = ethers.utils.parseUnits(USDP_AMOUNT, usdpDecimals);

      await approveTokens([usdp], ROUTER_ADDR, amountUSDPPARTNER);
      await approveTokens([partner], ROUTER_ADDR, amountPARTNER);

      const blockNumber = await ethers.provider.getBlockNumber();
      const blockData = await ethers.provider.getBlock(blockNumber);
      const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);

      // USDP-PARTNER
      if (!TESTING) {
        await addLiquidity(usdp.address, partner.address, amountUSDPPARTNER, amountPARTNER, deployer.address, deadline);
      }

      // RECORD NEW AMM POOL
      if (!TESTING) {
        const rubyPoolAddrs: Record<string, string> = {};

        rubyPoolAddrs.usdpPARTNER = await factory.getPair(usdp.address, partner.address);

        console.error("testing pool_exists ....", rubyPoolAddrs.usdpPARTNER);

        if (rubyPoolAddrs.usdpPARTNER !== '0x0000000000000000000000000000000000000000') {
          // read the file, and push new element to object
          const pool_object = JSON.parse(fs.readFileSync(`./deployment_addresses/new_pools_addr.${network.name}.json`, 'utf-8'));
          pool_object[`usdp${partnerSymbol}`] = rubyPoolAddrs.usdpPARTNER;
          console.error("new pool_object", pool_object);

          fs.writeFileSync(`./deployment_addresses/new_pools_addr.${network.name}.json`, JSON.stringify(pool_object));
        } else {
          console.error("new pool usdpPARTNER doesn't exist");
        }

      }

    } 

  }else {
    console.error("Deployer pkey incorrect");
  }

  // await debugPairs(factory, deployer.address);
  console.error("Script complete:");
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
