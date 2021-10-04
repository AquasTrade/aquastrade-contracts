import { ethers, network } from "hardhat";
import { RubyToken } from "../typechain";

const rubyAddr = require(`../deployments/${network.name}/RubyToken.json`).address;

const main = async () => {
  const [deployer] = await ethers.getSigners();
  const deployerAddr = deployer.address;

  const PREMINT_AMOUNT = 100_000_000; // 100 mil

  const ruby: RubyToken = (await ethers.getContractAt("RubyToken", rubyAddr)) as RubyToken;

  const amountWei = ethers.utils.parseUnits(PREMINT_AMOUNT.toString());
  const res = await ruby.mint(deployerAddr, amountWei);

  const receipt = await res.wait(1);

  if (receipt.status) {
    console.log("Ruby successfully preminted to deployer");
    const balanceOf = await ruby.balanceOf(deployerAddr);
    console.log(`Deployer balance: ${ethers.utils.formatUnits(balanceOf)}`);
  } else {
    console.log("Error while preminting Ruby tokens.");
  }
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
