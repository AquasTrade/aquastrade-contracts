# Deployment (WIP)

Deployments are network specific, so please use the `--network $network` tags for each command. For example: `yarn deploy --network localhost --tags RubyNFTFactory` will deploy the contracts at the localhost network. You can check the available networks at the `hardhat.config.ts` file.

If deploying for the first time, please follow the steps in order.

1. NFT related:

```
yarn deploy --tags RubyProxyAdmin
yarn deploy --tags RubyFreeSwapNFT
yarn deploy --tags RubyProfileNFT
yarn deploy --tags RubyNFTAdmin
```

2. AMM:

Before deploying AMM, ensure that the `initCodeHash` is correct for the correct network: `yarn initCodeHash --network $network`.
This code should be set at: `contracts/amm/libraries/UniswapV2Library.sol` at line 33, where the "// init code hash" comment is set. (NOTE: without the `0x` symbol)

```
yarn deploy --network localhost --tags UniswapV2Factory
yarn deploy --network localhost --tags UniswapV2Router02
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

a) Deploy ruby token if not deployed `yarn deploy --tags RubyTokenMainnet` or `yarn deploy --tags RubyToken`
b) Deploy RubyMasterChef `yarn deploy --tags RubyMasterChef`
c) Seed RubyMasterChef with RUBY tokens `yarn transferRUBYtoMS`

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

```
yarn deploy --tags SeedStablePool`
```

9. Ruby Router:

```
yarn deploy --tags RubyRouter
```

10. Seed RubyNFTAdmin:

```
yarn deploy --network localhost --tags SeedNFTAdmin
```

11. Seed RubyProfileNFT:

```
yarn deploy --tags SeedRubyProfileNFT
```

12. Utils:

```
yarn deploy --tags Multicall2`
```

13. Governance:

```
yarn deploy --tags Timelock
```
