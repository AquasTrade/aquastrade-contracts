# Deployment

Deployments are network specific, so please use the `--network $network` tags for each command. For example: `yarn deploy --network localhost --tags RubyNFTFactory` will deploy the contracts at the localhost network. You can check the available networks at the `hardhat.config.ts` file.

If deploying for the first time, please follow the steps in order.

If deploying on mainnet, you should set an expensive manual gasPrice in hardhat.config.ts - e.g. 2x gastracker 'high'.

## Prereq

`yarn install && yarn compile`

0. Tokens (Optional, if tokens are pre-deployed you don't need to deploy them again, however the codebase depends on
   them and they are required for testnet deployments.

Mock tokens:

1. `yarn deploy --tags MockUSDC`
2. `yarn deploy --tags MockUSDP`
3. `yarn deploy --tags MockUSDT`
4. `yarn deploy --tags MockDAI`
5. `yarn deploy --tags MockETH` (only for localhost testing)
or

`yarn deploy --tags MockTokens`
`yarn deploy --tags MockETH` (only for localhost testing)

Mapped tokens (L2):

1. `yarn deploy --tags RubyUSDC`
2. `yarn deploy --tags RubyUSDP`
3. `yarn deploy --tags RubyUSDT`
3. `yarn deploy --tags RubyDAI`

or

`yarn deploy --tags MappedTokens`

RubyToken:

1. `yarn deploy --tags RubyTokenMainnet` # L1 (i.e Mainnet, Rinkeby, Localhost, Goerli)
2. `yarn deploy --tags RubyToken` # L2 (i.e Skale, Skale testchain)

Wrapping native tokens:

1. `yarn deploy --tags WrapTokens`

or for `ETHC` only

1. `yarn deploy --tags WrapETHC`

Partner tokens:

1. `yarn deploy --tags PartnerTokens`

1. NFT related:

```
yarn deploy --tags RubyProxyAdmin
yarn deploy --tags RubyFreeSwapNFT
yarn deploy --tags RubyProfileNFT
yarn deploy --tags RubyNFTAdmin
```

2. AMM:

#### initCodeHash

Before deploying AMM, ensure that the `initCodeHash` is correct for the correct version of the code and for the correct network: `yarn initCodeHash --network $network`.

This code should be set at: `contracts/amm/libraries/UniswapV2Library.sol` at line 33, where the "// init code hash" comment is set. (NOTE: without the `0x` symbol)

Note: do NOT commit the value you find to the codebase because for the tests to pass
the value in the repository should be that generated using `--network hardhat`.

Current values (at time of this commit, post audit)

* hardhat  
  `0xaced2ededb8bce81917b80e9c38ddb1d0c392ebbfc1db63136f1343141a4ceaf`
* rubyNewChain (fancy-rasalhague)  
  `0xba9f7d123cf1f1b0f57891be300d90939d1a591af80a90cfb7e904a821927963`
* europa  
  `0xba9f7d123cf1f1b0f57891be300d90939d1a591af80a90cfb7e904a821927963`

#### Contracts


```
yarn deploy --tags UniswapV2Factory
yarn deploy --tags UniswapV2Router02
```


3. Staking:

```
yarn deploy --tags RubyStaker
yarn deploy --tags RubyMaker
```

or `yarn deploy --tags Staking`

4. Seed AMM:

```
yarn deploy --tags SeedAMM
```

5. Farm

* Deploy ruby token if not deployed  
  `yarn deploy --tags RubyTokenMainnet` or `yarn deploy --tags RubyToken`

Set the ruby emissions, percentage, and start date (if not now)

* Deploy RubyMasterChef  
  `yarn deploy --tags RubyMasterChef`

* Check ruby token balance (of deployer)  
  `yarn balances --network $network --address $deployer`

* Seed RubyMasterChef with RUBY tokens  
  `npx hardhat run scripts/transferRUBYtoMS.ts --network $network`

6. Set staking rewards

```
yarn deploy --tags SetStakingRewards
```

7. StableSwap:

```
yarn deploy --tags Allowlist
yarn deploy --tags AmplificationUtils
yarn deploy --tags SwapUtils
yarn deploy --tags LPToken
yarn deploy --tags SwapDeployer
yarn deploy --tags Swap
yarn deploy --tags RubyUSD4Pool
```

or: `yarn deploy --tags StableSwap`

8. Seed the stablePool:

* check USDX balances  
  `yarn balances --network $network --address $deployer`

* seed  
  `yarn deploy --tags SeedStablePool`

9. Ruby Router:

```
yarn deploy --tags RubyRouter
```

10. Seed RubyNFTAdmin:

```
yarn deploy --tags SeedNFTAdmin
```

11. Seed RubyProfileNFT and NFT Appearance:

```
yarn deploy --tags SeedRubyProfileNFT
yarn deploy --tags SeedNFTAppearance
```

12. Utils:

```
yarn deploy --tags Multicall2`
```

13. Faucet

```
yarn deploy --tags Faucet
```

14. Seed faucet

Note check amounts and network first!

```
npx hardhat run scripts/seeding/seedFaucet.ts
```

15. Lottery:

```
yarn deploy --tags RandomNumberGenerator
yarn deploy --tags LotteryBurner
yarn deploy --tags LotteryFactory
```

or

`yarn deploy --tags Lottery`

16. Governance:

(skipped in favour of MS governance I think)


```
yarn deploy --tags Timelock
```

17. Creating AMM Liquidty Pools and Farms

Note: read the contents of both files correctly, and take heed of the ATTN parts

* Liquidty pools (sets the price)  
  `hardhat run scripts/seeding/createAMMLPs.ts`
* Farm Rewarders  
  `yarn deploy --tags DualRewardRewarders`
* Farms  
  `hardhat run scripts/seeding/createFarms.ts`

18. Post deploy tasks

* sanity check that the code hash is the same as you deployed and recorded in this document  
  `yarn initCodeHash --network $network`
* check ABIs are up to date  
  `yarn export-abis --network $network`
* make a test ruby router swap (default is dry run)  
  `npx hardhat run scripts/debugging/testrrswap.ts --network $network`
* verify contracts on the blockexplorer 
  `npx hardhat run scripts/verify/verifyRubyContracts.ts --network $network`

# How to Re-deployment (SCs not using upgradeable)

* in general, but especially if redeploying anything that calls into Uni,
  ensure the code hash is the same as that was deployed and recorded in this doc.

# Post-deployment tasks

* update addresses in backend
* update ABIs in backend
* update code hash in backend
