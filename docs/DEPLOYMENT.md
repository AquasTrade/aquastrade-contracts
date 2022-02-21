
# Deployment (WIP)

Deployments are network specific, so please use the `--network $network` tags for each command. For example: `yarn deploy --network localhost --tags RubyNFTFactory` will deploy the contracts at the localhost network. You can check the available networks at the `hardhat.config.ts` file. 

If deploying for the first time, please follow the steps in order.

1. NFT related:
```
yarn deploy --tags RubyProxyAdmin
yarn deploy --tags RubyNFTFactory
yarn deploy --tags RubyFreeSwapNFT
yarn deploy --tags RubyProfileNFT
yarn deploy --tags RubyFeeAdmin
```

2. AMM:
```
yarn deploy --network localhost --tags UniswapV2Factory 
yarn deploy --network localhost --tags UniswapV2Router02
```

3. Seed RubyNFTFactory:
```
yarn deploy --network localhost --tags SeedNFTFactory
```

4. Staking:
```
yarn deploy --tags RubyStaker
yarn deploy --tags RubyMaker
```

4. Staking:
```
yarn deploy --tags RubyStaker
yarn deploy --tags RubyMaker
```

or `yarn deploy --tags Staking`


5. Seed AMM:
```
yarn deploy --tags SeedAMM
```

6. Farm

a) Deploy ruby token if not deployed `yarn deploy --tags RubyTokenMainnet` or `yarn deploy --tags RubyToken`
b) Deploy RubyMasterChef `yarn deploy --tags RubyMasterChef`
c) Seed RubyMasterChef with RUBY tokens `yarn transferRubyTokensToMasterChef`

7. Set staking rewards
```
yarn deploy --tags SetStakingRewards
```


8. StableSwap:
```
yarn deploy --tags Allowlist
yarn deploy --tags AmplificationUtils
yarn deploy --tags SwapUtils
yarn deploy --tags LPToken
yarn deploy --tags SwapDeployer
yarn deploy --tags Swap
yarn deploy --tags RubyUSD4Pool
```

or:  `yarn deploy --tags StableSwap`


9. Seed the stablePool:
```
yarn deploy --tags SeedStablePool`
```

10. Ruby Router:
```
yarn deploy --tags RubyRouter
```

11. Utils:
```
yarn deploy --tags Multicall2`
```

12. Governance:
```
yarn deploy --tags Timelock
```