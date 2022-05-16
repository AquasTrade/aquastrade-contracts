# Preparing a MS Controlled Skale Chain

The goal is to, during deployment, have the Skale chain
resemble as close as possible a normal 'single-key' controlled
Skale chain, so as to maximise use of our existing deployment
tooling.

The chain is practicaly secured from external use by
the absense of sFUEL on any external addresses, and
the absense of permissions to deploy contracts or to
manage IMA configuration

### Tools
* Ubuntu 20.04 LTS
* multisig-cli  
  http  
  `b3e02e3e33140c6a40d4812ef74133cadb39331d`

### Chain

* Chain Name: `elated-tan-skat`
* RPC Endpoint:  
  `https://mainnet.skalenodes.com/v1/elated-tan-skat`  
  `wss://mainnet.skalenodes.com/v1/ws/elated-tan-skat`
* Chain ID:  
  `0x79f99296`  
  `2046399126`
* Block Explorer:  
  https://elated-tan-skat.explorer.mainnet.skalenodes.com


### Addresses

* Chain Originator Key  
  `0xc7D...855`  
    * From Jasper trezor
    * 1 Signer on Chain Owner MS (L1)
    * 1 Signer on Chain Owner MS (L2)
* Test user wallet  
  `0xa54Ca8922c39582c3aB930241c7aC23Ec05A4018`
    * 'EuropaTest0'
* Deployer  
  `0x0fe812C977646525E824D5dCC3f37A0Cf153B13b`
* Salary-Treasury MS (L1)  
  `0x76f...715`
* Treasury MS (L2)  
  `0xfE3fd4C4bb91800347Cb4eE367332f417E70eb4a`
* Chain Owner MS (L1)  
  `0x7A1...609`
* Chain Owner MS (L2, MultiSigWallet)  
  `0xD244519000000000000000000000000000000000`

1. Gassing the pre-deployed MS from L1 (to test things work)

`$ npx msig encodeData elated-tan-skat Etherbase partiallyRetrieve 0xD244519000000000000000000000000000000000 100000000`

2. Granting the MSW permission to change deployer configuration  
  * `DEPLOYER_ADMIN_ROLE = keccak256("DEPLOYER_ADMIN_ROLE")`
  * `0xD244519000000000000000000000000000000000`  MultiSigWallet on L2

`$ npx msig encodeData elated-tan-skat ConfigController grantRole 0x9544cf69999ca161b850d3ca69235f410d88604f143ae3be6650b68b133a5dae 0xD244519000000000000000000000000000000000`

Now the MSW wallet on L2 has `DEPLOYER_ADMIN_ROLE` so can call `ConfigController.addToWhitelist()`

3. Grant deployer permissions to the originator key so that it can create additional
   treasury MSWs on L2
   * Go to MSW and add the details of the config controller
     * the ABI from https://github.com/skalenetwork/config-controller/releases
     * the Address of ConfigController `0xD2002000000000000000000000000000000000D2`
     * call `addToWhitelist(0xc7dfdc89093e6b6c9f8d81329f09ec5c73c6a855)`
