# Preparing and Deploying to a MS Controlled Skale Chain

~The goal is to, during deployment, have the Skale chain
resemble as close as possible a normal 'single-key' controlled
Skale chain, so as to maximise use of our existing deployment
tooling.~

It turns out that this goal was not possible or advantageous for
two reasons
1. many necessary permissions can not be granted or delegated
   to any addresses other than the chain owner, e.g. 
   `tokenManager.addERC20TokenByOwner`
2. the best (only?) tooling on Skale is the multisig-cli
   tool which can only assembled bytecode to be executed by
   the L1 MS (chain owner).
3. Some of the above could have been in theory executed on the
   L2 side using MSW, but that is a PITA because the UX barely
   works and it doesnt support Trezor etc

Note: while doing this process, the chain is practicaly
secured from external use by the absense of sFUEL on any external
addresses, and the absense of permissions to deploy contracts or to
manage chain configuration.

### Tools
* Ubuntu 20.04 LTS
* multisigwallet-cli  
  https://github.com/skalenetwork/multisigwallet-cli (version `b3e02e3e33140c6a40d4812ef74133cadb39331d`)

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


### Useful Addresses

* Chain Originator Key  
  `0xc7DFdc89093E6b6C9f8D81329F09Ec5C73C6A855`  
    * From Jasper trezor
    * 1 Signer on Chain Owner MS (L1)
    * 1 Signer on Chain Owner MS (L2)
* Test user wallet  
  `0xa54Ca8922c39582c3aB930241c7aC23Ec05A4018`
    * 'EuropaTest0'
* Deployer  
  `0x0fe812C977646525E824D5dCC3f37A0Cf153B13b`
* Chain Owner Gnosis Safe (L1)  
  `0x7A14B74866B656D46788E889029a943A6AF26609`


### Useful Pre-deploy Contract Addresses (L2 Side)

These addresses are used in configuration commands below

* Chain Owner MS (L2, MultiSigWallet)  
  `0xD244519000000000000000000000000000000000`
* `ConfigController`  
  `0xD2002000000000000000000000000000000000D2`

## Deployment Steps

### Preparation

1. Gassing the pre-deployed MS from L1 (to test things work)  
   ```
   $ npx msig encodeData elated-tan-skat Etherbase partiallyRetrieve 0xD244519000000000000000000000000000000000 100000000
   ```

2. Granting the MSW permission to change deployer configuration  
  * `DEPLOYER_ADMIN_ROLE = keccak256("DEPLOYER_ADMIN_ROLE")`
  * `0xD244519000000000000000000000000000000000`  MultiSigWallet on L2
  * use multisigwallet-cli to create the payload for gnosis safe  
    ```
    $ npx msig encodeData elated-tan-skat ConfigController grantRole 0x9544cf69999ca161b850d3ca69235f410d88604f143ae3be6650b68b133a5dae 0xD244519000000000000000000000000000000000
    ```

Now the MSW wallet on L2 has `DEPLOYER_ADMIN_ROLE` so can call `ConfigController.addToWhitelist()`

3. Grant deployer permissions to the originator key so that it can create additional
   treasury MSWs on L2
   * Go to MSW and add the details of the config controller
     * the ABI from https://github.com/skalenetwork/config-controller/releases
     * the Address of ConfigController `0xD2002000000000000000000000000000000000D2`
     * call `addToWhitelist(0xc7dfdc89093e6b6c9f8d81329f09ec5c73c6a855)`
   * Note: in hindsight I should have done this from the L1 side because MSW is
     a pain.

4. Create additional multisig wallets and wallets used for management and controlling ruby
   dApp (when the ownership is transferred to them)  
   See [README.md](../README.md)
   * Ruby Treasury (L2)  
   `0xfE3fd4C4bb91800347Cb4eE367332f417E70eb4a`
   * Ruby Management (L2)  
   `0x60592CB8ceD45A2dc432CB1Fe49c2Fa1a6bfa423`

### Actual Deployment

Note: these steps are more or less equivalent to [registerTokensToIMA.ts](../scripts/bridging/registerTokensToIMA.ts)
except they have to be manually executed and signed via L1 MS.

#### IMA Config (per-token)

Note: do the L1-side (`DepositBox`) side first. This contract is on L1 so it is not done
using the `multisig-cli` tool, but rather by calling SCs on L1 directly.

* DepositBoxERC20 contract
  * Address: `0x8fB1A35bB6fB9c47Fb5065BE5062cB8dC1687669` (from
    [here](https://github.com/skalenetwork/skale-network/blob/master/releases/mainnet/IMA/1.3.0/mainnet/contracts.json))
  * ABI: copy-paste from [here](https://etherscan.io/address/0x0209b161d99e121c026697f6c7558905a9bd7089#code) 
    implementor of above proxy - The Skale ABI from the prevous repo is mangled in such a way to mean it
    cant be copy-pasted into Gnosis and I cant find it written simply anywhere else!

* Ruby Token
  * L1: **Use DepositBoxERC20 notes above, and Gnosis Safe UI to call this**  
  `addERC20TokenByOwner("elated-tan-skat", "0x918D8F3670c67f14Ff3fEB025D46B9C165d12a23")`
  * L2:  
    ```
    $ npx msig encodeData elated-tan-skat TokenManagerERC20 addERC20TokenByOwner Mainnet 0x918D8F3670c67f14Ff3fEB025D46B9C165d12a23 0x2B4e4899b53E8b7958c4591a6d02f9C0b5c50F8f
    ```
  
* USDT
* USDC
* SKL
* Dai
* WBTC


