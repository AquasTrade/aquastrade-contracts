### How map a new L1 token to a multisig controlled chain

#### Optional: deploy a mock token on testnet first to test, e.g. HMT

* Delete deployed contracts
* Redeploy contracts
  - yarn deploy --network goerli --tags MockHMT `0x4058d058ff62ED347dB8a69c43Ae9C67268B50b0`
  - yarn deploy --network stagingv3 --tags RubyHMT `0x99bF0243815ffa1F4c6C8367C88D09aDaF6f42ee`
  - yarn deploy --network stagingv3 --tags WrapTokens `0x4F71f255033040C04a9e91c24779634e50ea96F5`
* L1 GnosisSafe: register the deployed L1 token to the L1 Skale DepositBox 
  - connect to safe with signer: `0xa17538295A564E97662324a8735a6EBa3b850c57` 
  - interact with contract: use the Goerli DepostBoxERC20  `0x2F4B31e661955d41bd6ab5530b117758C26C8159` , add abi, and select the function. `addERC20TokenByOwner` 
  - 1. `addERC20TokenByOwner("staging-legal-crazy-castor", "0x4058d058ff62ED347dB8a69c43Ae9C67268B50b0")`
  - DepositBox will not register transaction on front-page(transactions tab: must look in internal transactions)
  - interact with contract: use the Skale IMA MessageProxy  `0x08913E0DC2BA60A1626655581f701bCa84f42324` and generate the payload using the MSW-cli with command:
  - 2. `npx msig encodeData staging-legal-crazy-castor TokenManagerERC20 addERC20TokenByOwner Mainnet 0x4058d058ff62ED347dB8a69c43Ae9C67268B50b0 0x99bF0243815ffa1F4c6C8367C88D09aDaF6f42ee`
  - paste the output into the data encode (GS-UI), Sumbit transaction (batch transaction)

* Altervative: Register with L2
  - `L2 GnosisSafe` : 
    - interact with contract: TokenManager: `0xD2aAA00500000000000000000000000000000000` , add abi, and select the function. `addERC20TokenByOwner` 
    - `addERC20TokenByOwner("Mainnet", "0x4058d058ff62ED347dB8a69c43Ae9C67268B50b0","0x99bF0243815ffa1F4c6C8367C88D09aDaF6f42ee" )`
    - check logs within MSW tx to confirm function calls

* HMT Example 
  Transactions: 
  - 1. https://goerli.etherscan.io/tx/0xfc1aebca1d146a7e375059efb088b4f238364c36e92c9559d5f49b54e077223e 
  - 2. https://goerli.etherscan.io/tx/0x6ecb7ebbc51982485ff611a6743cfffe2f9a9515c26e3442ab7eae0484205439
 
