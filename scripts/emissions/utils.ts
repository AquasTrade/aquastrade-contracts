import fs from "fs";

import { ethers, network } from "hardhat";
import { RubyMasterChef, UniswapV2Factory } from "../../typechain";
import { PoolAddressesJSONDict } from "../utils"

export const getDependents = async () : Promise<{masterChef: RubyMasterChef, factory: UniswapV2Factory, ssAddr: string, pools: PoolAddressesJSONDict}> => {
    const CHEF_ADDR = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;
    const masterChef: RubyMasterChef = (await ethers.getContractAt("RubyMasterChef", CHEF_ADDR)) as RubyMasterChef;
    const FACTORY_ADDR = require(`../../deployments/${network.name}/UniswapV2Factory.json`).address;
    const factory: UniswapV2Factory = (await ethers.getContractAt("UniswapV2Factory", FACTORY_ADDR)) as UniswapV2Factory;
    const SS4P_LPADDR = require(`../../deployments/${network.name}/RubyUSD4PoolLPToken.json`).address;
    const pools = JSON.parse(fs.readFileSync(`./deployment_addresses/new_pools_addr.${network.name}.json`, {encoding: "utf-8"})) as PoolAddressesJSONDict;

    return {masterChef, factory, ssAddr: SS4P_LPADDR, pools}
}