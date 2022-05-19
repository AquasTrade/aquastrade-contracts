/* eslint no-use-before-define: "warn" */
import { ethers, network } from "hardhat";

const main = async () => {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];

  if (network.name !== "mainnet") {
    throw new Error("Network not supported");
  }

  console.log("Address:", signer.address);

  // cancel stuck tx
  console.log(await ethers.provider.getTransactionCount(signer.address, 'pending'));

  //// check this nonce is reasonable and is 1 higher than the one in etherscan
  ////const tx = {
  ////	nonce: 13,  // nonce
  ////	to: ethers.constants.AddressZero,
  ////	data: '0x',
  ////	gasPrice: 50000000000  // from gastracker gwei -> wei
  ////}; // costs 21000 gas
  ////await signer.sendTransaction(tx);
  
  let ethBalance = await ethers.provider.getBalance(signer.address);
  console.log(
    `ETH balance: ${ethers.utils.formatEther(ethBalance)}`)

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
