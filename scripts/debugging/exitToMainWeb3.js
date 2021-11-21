const Web3 = require("web3");
const Tx = require("ethereumjs-tx").Transaction;

let schainABIs = require("../ima_bridge/l2_artifacts.json");
let privateKey = "0x0c5a15b51cdd9d0c2ac002f024e8be52e1e7f43e9f113170365d7ecf800efb37";
let account = "0xF63Bb14E7E9bD2882957129c3E3197E6D18933B4";
let schainEndpoint = "https://dappnet-api.skalenodes.com/v1/melodic-murzim";

const tokenManagerAddress = schainABIs.token_manager_eth_address;
const tokenManagerABI = schainABIs.token_manager_eth_abi;

const web3 = new Web3(new Web3.providers.HttpProvider(schainEndpoint));

let contract = new web3.eth.Contract(tokenManagerABI, tokenManagerAddress);

/*
 * prepare the smart contract function
 * exitToMain(address to)
 */
let exitToMain = contract.methods.exitToMain(web3.utils.toWei("0.5", "ether")).encodeABI();

//get nonce
web3.eth.getTransactionCount(account).then(async nonce => {
  //create raw transaction
  const rawTx = {
    chainId: 2197884595910940,
    nonce: "0x" + nonce.toString(16),
    from: account,
    nonce: "0x" + nonce.toString(16),
    data: exitToMain,
    to: tokenManagerAddress,
    gasPrice: 100000000000,
    gas: 8000000,
  };

  //sign transaction
  //   const tx = new Tx(rawTx);
  //   tx.sign(privateKey);
  const tx = await web3.eth.accounts.signTransaction(rawTx, privateKey);

  //serialize transaction
  const serializedTx = tx.rawTransaction;

  //send signed transaction
  web3.eth
    .sendSignedTransaction(serializedTx)
    .on("receipt", receipt => {
      //record receipt to console
      console.log(receipt);
    })
    .catch(console.error);
});
