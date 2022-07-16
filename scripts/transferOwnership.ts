import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";


interface Arguments {
  address: string,
}

const OWNABLE_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

const main = async (taskArgs: Arguments, hre: HardhatRuntimeEnvironment) => {
  const ethers = hre.ethers;

  const [deployer] = await ethers.getSigners();

  let accounts = await hre.getNamedAccounts();
  console.log(`Transferring Ownership of Contract:${taskArgs.address} -> Address:${accounts.management}`);

  const contract = new ethers.Contract(taskArgs.address, OWNABLE_ABI, ethers.provider)

  const res = await contract.connect(deployer).transferOwnership(accounts.management);
  const receipt = await res.wait();

  if (receipt.status) {
    console.log(`Ownership transfer successful (tx: ${receipt.transactionHash})`);
  } else {
    console.log(`Ownershop transfer failed (tx: ${receipt.transactionHash})`);
  }

};

task("transferOwnership", "Transfers ownership of contract to management address")
  .addParam("address", "Contract address")
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre);
  });
