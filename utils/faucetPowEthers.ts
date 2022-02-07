import BN from "bn.js";
import crypto from "crypto";
import { ethers } from "ethers";

export const pow = (gasAmount: number, sender: string, nonce: number): string => {
  const DIFFICULTY = new BN(1);
  const nonceHex = nonce === 0 ? "0x00" : ethers.utils.hexValue(nonce);
  let nonceHash = new BN(ethers.utils.keccak256(nonceHex).slice(2), 16);
  let addressHash = new BN(ethers.utils.keccak256(sender).slice(2), 16);
  let nonceAddressXOR = nonceHash.xor(addressHash);
  let maxNumber = new BN(2).pow(new BN(256)).sub(new BN(1));

  let divConstant = maxNumber.div(DIFFICULTY);
  let candidate;

  while (true) {
    candidate = new BN(crypto.randomBytes(32).toString("hex"), 16);
    const candidateHex = ethers.utils.toUtf8Bytes(candidate.toString());
    let candidateHash = new BN(ethers.utils.keccak256(candidateHex).slice(2), 16);
    let resultHash = nonceAddressXOR.xor(candidateHash);
    let externalGas = divConstant.div(resultHash).toNumber();
    if (externalGas > 50000) {
      console.log("external gas", externalGas, gasAmount);
    }

    if (externalGas >= gasAmount) {
      break;
    }
  }

  return candidate.toString();
};