import { ethers } from "hardhat";

import l2artifacts from "../../ima_bridge/l2_artifacts.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";


const connectSchain = async (signer: SignerWithAddress) => {
    const tokenManagerLinkerAddress = l2artifacts.token_manager_linker_address;
    const tokenManagerLinkerABI = l2artifacts.token_manager_linker_abi;
    const tokenManagerLinkerContract = new ethers.Contract(tokenManagerLinkerAddress, tokenManagerLinkerABI, signer);
  
    let tx = await tokenManagerLinkerContract.connectSchain('whispering-turais');
    const rec = await tx.wait(1);
    console.log("receipt", rec);

    let isConnected = await tokenManagerLinkerContract.hasSchain('whispering-turais');
    console.log("is connected sChain", isConnected);
  }

  const bridgeToSchain = async (signer: SignerWithAddress) => {
    const tokenManagerErc20Addr = l2artifacts.token_manager_erc20_address;
    const tokenManagerErc20Abi = l2artifacts.token_manager_erc20_abi;
    const tokenManagerErc20Contract = new ethers.Contract(tokenManagerErc20Addr, tokenManagerErc20Abi, signer);
  
    let usdcContract = await ethers.getContract("MockUSDC");

    const amount = ethers.utils.parseUnits("1", 6);

    let approveTx = await usdcContract.approve(tokenManagerErc20Addr, amount);

    let rec = await approveTx.wait(1);
    console.log("approve receipt", rec);

    let transferTx = await tokenManagerErc20Contract.transferToSchainERC20('whispering-turais', usdcContract.address, amount);

    rec = await transferTx.wait(1);
    console.log("transfer receipt", transferTx);
  }


  const main = async () => {
    const signer: SignerWithAddress = (await ethers.getSigners())[0];
  

      await connectSchain(signer);
      await bridgeToSchain(signer);
  };
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });