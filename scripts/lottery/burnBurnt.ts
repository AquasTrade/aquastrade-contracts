import { ethers, network } from "hardhat";
import { utils } from "ethers";
import { LotteryBurner, RubyToken } from "../../typechain";


const rubyAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
const lotteryBurnerAddr = require(`../../deployments/${network.name}/LotteryBurner.json`).address;

const main = async () => {
  const [deployer] = await ethers.getSigners();

  const burner: LotteryBurner = (await ethers.getContractAt("LotteryBurner", lotteryBurnerAddr)) as LotteryBurner;
  const ruby: RubyToken = (await ethers.getContractAt("RubyToken", rubyAddr)) as RubyToken;

  const toBurn = await ruby.balanceOf(lotteryBurnerAddr);

  console.log("RUBY supply", ethers.utils.formatUnits(await ruby.totalSupply(), 18))
  console.log("Balance of RUBY in lottery burner contract",
              ethers.utils.formatUnits(toBurn, 18))
  console.log("RUBY already burnt by lottery burner contract",
              ethers.utils.formatUnits(await burner.burned(), 18))

  const burnerRole = await ruby.BURNER_ROLE();

  let res;

  if ((await ruby.hasRole(burnerRole, lotteryBurnerAddr)) === false) {
    res = await ruby.connect(deployer).grantRole(burnerRole, lotteryBurnerAddr);
    await res.wait(1);
    console.log("RUBY burner role granted to LotteryBurner");
  }

  if (toBurn.gt(0)) {
    console.log("Burning...");

    res = await burner.connect(deployer).burn()
    await res.wait(1);

    console.log("RUBY supply", ethers.utils.formatUnits(await ruby.totalSupply(), 18))
    console.log("Balance of RUBY in lottery burner contract",
        ethers.utils.formatUnits(await ruby.balanceOf(lotteryBurnerAddr), 18))
  } else {
    console.log("Nothing to burn");
  }

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });