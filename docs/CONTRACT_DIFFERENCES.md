# Contract differences

This document outlines the differences from the forked contracts. This is a TL;DR version of the `ARCHITECTURE.md` document,
for more details please check that document.

## Forked contracts

We've forked the following contracts/contract achitectures:

1. Uniswap V2 AMM (amm), forked from sushiswap :
https://github.com/sushiswap/sushiswap/tree/bef474629c6ab75f0efc511234f32d760db241aa

2. Trader Joe MasterChef V2 (RubyMasterChef.sol) forked from Trader Joe:
https://github.com/traderjoe-xyz/joe-core/tree/ec25d93533427328c576c38e7987485ba0ffd27d

3. Sushi's Maker (RubyMaker.sol), forked from SushiSwap:
https://github.com/sushiswap/sushiswap/tree/bef474629c6ab75f0efc511234f32d760db241aa

4. Elipsis Finance Staking contract (RubyStaker.sol), forked from Elipsis Finance:
https://github.com/ellipsis-finance/ellipsis/tree/6bdf7788020695b72034f5c9f1fda11c5e3cefb7

5. Saddle Finance stable swap (stable_swap), forked from Saddle Finance:
https://github.com/saddle-finance/saddle-contract/tree/6f37f97b9600196c75416e2f579165e74906eb76

(The references are pointing to the hashes that the contracts have been cloned at).


## Contract differences

1. Uniswap V2 AMM:
- RouterV2: Removal of the native token functions (swap functions involving ETH)
- RouterV2 and FactoryV2: Permissions set on who can create trading pairs
- RouterV2 and Library: Dynamic trading fee applied depending on the message sender (more concretely the NFT holdings of a message sender)
- UniswapV2Router02 is upgradeable (TransparentUpgradeableProxy)

2. RubyMasterChef.sol
- Reductions of the amount of fee recipients
- Tokens not minted directly, but sent to RubyStaker contract for vesting

3. RubyMaker.sol
- Upon token conversion, certain proportion of the tokens is burned (20%), the rest is sent to the RubyStaker contract for distribution

4. RubyStaker.sol
- Distribution token tracking by ID (uint256) instead of address. This is to allow the same token to be distributed for different purposes - in our case for farming rewards (RUBY tokens sent by RubyMasterChef) but also for fee distribution (RUBY tokens sent by RubyMaker).

5. Stable swap:
- No contract modifications
