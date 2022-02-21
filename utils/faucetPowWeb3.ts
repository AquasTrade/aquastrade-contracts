import BN from "bn.js";
import crypto from "crypto";
import Web3 from "web3";
import { Mixed } from "web3/utils";

const DIFFICULTY = new BN(1);

export const pow = (gasAmount: number, address: string, nonce: number, web3: Web3) => {
  let nonceHash = new BN((web3.utils.soliditySha3(nonce) as string).slice(2), 16);
  let addressHash = new BN((web3.utils.soliditySha3(address) as string).slice(2), 16);
  let nonceAddressXOR = nonceHash.xor(addressHash);
  let maxNumber = new BN(2).pow(new BN(256)).sub(new BN(1));
  let divConstant = maxNumber.div(DIFFICULTY);
  let candidate;
  while (true) {
    candidate = new BN(crypto.randomBytes(32).toString("hex"), 16);
    let candidateHash = new BN((web3.utils.soliditySha3(candidate as Mixed) as string).slice(2), 16);
    let resultHash = nonceAddressXOR.xor(candidateHash);
    let externalGas = divConstant.div(resultHash).toNumber();
    if (externalGas >= gasAmount) {
      break;
    }
  }
  return candidate.toString();
};
