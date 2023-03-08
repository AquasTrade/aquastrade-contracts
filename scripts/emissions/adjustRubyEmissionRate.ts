import { ethers } from "hardhat";
import { getDependents } from "./utils";

const HUMAN_AMOUNT = "15";

const main = async () => {
    const { masterChef } = await getDependents();

    const amount = ethers.utils.parseUnits(HUMAN_AMOUNT, 18);
    console.log("RUBY PER SECOND wei Value: " , amount.toString())

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