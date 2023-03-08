import { ethers, network } from "hardhat";
const masterChefAddr = require(`../../deployments/${network.name}/RubyMasterChef.json`).address;

const HUMAN_AMOUNT = "15";

const getMasterChef = async () => {
    const res = await ethers.getContractAt("RubyMasterChef", masterChefAddr);
    return res;

}

const main = async () => {

    const amount = ethers.utils.parseUnits(HUMAN_AMOUNT, 18);
    console.log("RUBY PER SECOND wei Value: " , amount.toString())

    const masterChef = await getMasterChef();
    const res = await masterChef.updateEmissionRate(amount);
    await res.wait(1);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

/*

$ npx hardhat run scripts/emissions/adjustEmissionRate.ts --network rubyNewChain

*/