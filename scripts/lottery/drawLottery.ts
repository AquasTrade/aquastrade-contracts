import fs from "fs";
import { ethers, network } from "hardhat";
import { utils } from "ethers";

const main = async () => {
  console.log(process.argv)
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });