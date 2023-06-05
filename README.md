# README

Please check out the `docs` directory for more info.

## Addresses

Deployer
* L1,L2: `0x0fe812c977646525e824d5dcc3f37a0cf153b13b`
* L2(testnet): `0xF63Bb14E7E9bD2882957129c3E3197E6D18933B4`

Ruby Treasury (L2)  
`0xfE3fd4C4bb91800347Cb4eE367332f417E70eb4a`

Ruby Management (L2)  
`0x60592CB8ceD45A2dc432CB1Fe49c2Fa1a6bfa423`

RUBY Token
* L1: `0x918D8F3670c67f14Ff3fEB025D46B9C165d12a23`
* L2: `0x2B4e4899b53E8b7958c4591a6d02f9C0b5c50F8f`

## Quickstart

* testing  
  `$ npx hardhat test --network hardhat test/lottery/LotteryBurner.test.ts`
* interactive console  
  `$ npx hardhat console --network stagingv3`

## Useful Debugging and Maintenance Commands

* `yarn rubyStatus --network europa`  
  prints pools and farms etc
* `npx hardhat addresses --network stagingv3`  
  prints the addresses of important contracts and multisigs/EOAs
* `npx hardhat balances --network stagingv3 --address 0x123`  
  prints the balances of native and a number of tokens of the supplied address

