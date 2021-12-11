import { ethers, network } from "hardhat";
import { WETH } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

const WETHaddress = require(`../../deployments/${network.name}/WETH.json`).address;

const main = async () => {
  const weth: WETH = (await ethers.getContractAt("WETH", WETHaddress)) as WETH;
  const deployer: SignerWithAddress = (await ethers.getSigners())[0];

  const res = await weth.deposit({ value: ethers.utils.parseUnits("1000", 18) });
  await res.wait(1);
  const wethBalance = await weth.balanceOf(deployer.address);

  console.log("Deployer Balance WETH:", ethers.utils.formatUnits(wethBalance, 18));
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
