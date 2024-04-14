# Aqua-Dex

Aquas.Trade protcol is a fork of Ruby.Exchange without the DaoCreator AMM pairs management and with 3 NFT Tiers for swap discounts.

# Architecture

This document describes the contract architecture of the Ruby protocol.

## Introduction

The Ruby contract architecture is currently composed of few different components, such as:

- Generic AMM exchange (Uniswap v2 style exchange, forked from Sushiswap)
- StablePool exchange (Curve finance style pool for like assets, forked from Saddle finance )
- Farms (Masterchef implementation, based on Sushiswap's masterchef design, forked from Trader Joe)
- Ruby staking (Elipsis finance staking/rewards implementation)
- Ruby router (original implementation)
- RubyToken (based on SushiToken implementation, changes made because of bridging)

## Components

### Generic AMM exchange

The generic AMM exchange, represents a Uniswap V2 style exchange. It's used for swapping different types of assets, based on the provided liquidity. The contracts are foked from the [Sushiswap contracts repo](https://github.com/sushiswap/sushiswap/tree/bef474629c6ab75f0efc511234f32d760db241aa).
Some slight changes have been made:

1. ETH related functions have been removed. Functions such as: `addLiquidityETH`, `removeLiquidityETH`, `removeLiquidityETHWithPermit`, `removeLiquidityETHSupportingFeeOnTransferTokens`, `removeLiquidityETHWithPermitSupportingFeeOnTransferTokens`, `swapExactETHForTokens`, `swapTokensForExactETH`, `swapExactTokensForETH`, `swapETHForExactTokens`, have been removed. This means that swaps cannot be initiated from ETH, and the output can't be ETH. This is because the native token on Skale Chains is worthless (skETH), and the ETH token is represented as ERC20 token. The AMM works with ERC20 tokens only.

2. Permisssions for creating Pools added. Only a previously whitelisted actors can create liquidity pools. Anyone can add liquidity to an already created pool.

3. Swap functions `swapTokensForExactTokens`, `swapExactTokensForTokens`,`swapExactTokensForTokensSupportingFeeOnTransferTokens` in the `UniswapV2Router02.sol` contract have been changed to work with variable feeMultiplier. We've implemented a feature that allows for dynamic fee (0% or 0.30% currently) to be applied to the trades, based on the logic implemented in the NftAdmin contract (more on that below).

As per the original Uniswap V2 design, a fixed fee was charged on each swap. The swap fee was set to be 0.30% of the swap amount (30 BIPS) - Currently 0 or 30 BIPS depending on the tx.origin. If a protocol fee is enabled and a 30 BIPS fee is charged (the `feeTo` address is set at the `UniswapV2Factory.sol` contract), 0.25% of the swap amount (83.3% of the total fee) goes to the liquidity providers, while 0.05% of the swap amount (16.7% of the total fee) goes to the `feeTo` address.
In the Ruby protocol, the `feeTo` address is set to the address of the `RubyMaker` contract.

4. `UniswapV2Library.sol` functions - `getAmountOut`, `getAmountIn`, `getAmountsOut`, `getAmountsIn`, have been changed to accept a feeMultiplier parameter. This parameter serves to get the output or input amount also considering the fee applied for the swap.

#### RubyMaker

The `RubyMaker` contract converts the tokens that the fee was received in to RUBY and distributes 80% of the converted amount to the Ruby stakers (via the `RubyStaker.sol` contract). The 20% of the converted amount is burned.

The fee math is as follows:

```
    0.05% (1/6th) of the total fees (0.30%) are sent to the RubyMaker
    0.04% of these fees (80%) are converted to Ruby and sent to the RubyStaker
    0.01% of these fees (20%) are burned
```

The RubyMaker contract is a fork from the `SushiMaker` contract, but is modified so that it burns the converted RUBY, and also is integrated with the `RubyStaker` contract.

### Stable pool exchange

The stable pool exchange represents a single pool for likewise assets. The assets are stablecoins, in particular: USDP, USDT, USDC, DAI.
The StablePool contracts are forked from [Saddle Finance](https://github.com/saddle-finance/saddle-contract/tree/6f37f97b9600196c75416e2f579165e74906eb76), and no changes are applied to them. The StablePool is deployed with the following parameters:

- Tokens: USDP, DAI, USDC, USDT
- Initial A parameter: 200
- Swap Fee: 4e6 (4 BPS)
- Admin Fee: 0

### Farm

Liquidity providers on both AMM and StablePool can lock their LP tokens for additional rewards in RUBY tokens. This feature is enabled by the Ruby Farm. The earned Ruby rewards have a vesting period of 3 months, and are paid out by the RubyStaker contract. The vesting period for pending unvested tokens starts when a user deposits or withdraws LP tokens, or explicitly claims the pending reward tokens (`deposit`, `withdraw`, `claim` functions).

The Farm feature is implemented via the RubyMasterChef. The RubyMasterChef is a fork of [Trader Joe MasterChefJoeV2 contract](https://github.com/traderjoe-xyz/joe-core/tree/ec25d93533427328c576c38e7987485ba0ffd27d), which is based on Sushi's MasterChef contracts.
The MasterChef contracts supports double farm rewards. For each pool a separate rewarder could be specified with its own logic, implementing the `IRewarder` interface.

The double rewards (if a `rewarder` is set for the pool), are minted on interaction with the `deposit` and `withdraw` functions.

Changes are made from the Trader Joe's MasterChef contract:

1. Only a single fee recepeint is present in our MasterChef (`treasuryAddr`), and fee to the fee recepient is specified via the `treasuryPercent` variable. Thus the LP percent when calculating RUBY rewards is dependent only on the `treasuryPercent` variable.

2. The RubyMasterChef needs to be pre-seeded with RUBY tokens in order to be able to pay RUBY rewards. The RubyMasterChef transfers RUBY tokens upon rewards, but does not mint them. This is because the RUBY token will be launched on Ethereum Mainnet, and then bridger over to the SChain. The IMA bridge will be used for this. The IMA bridge works by minting and burning tokens. Thus the IMA bridge contracts need to be assigned `minter` role to the RUBY token contract.
   Having multiple minters, could leave to insolvencies in our case.

3. The RubyMasterChef is made to work in collaboration with the `RubyStaker` contract. Upon claiming RUBY rewards, the (that is when `withdraw`, `deposit` and `claim` functions are called), the `mint` function on the RubyStaker contract is called with the user's address and amount that need to be rewarded. After that the amount of RUBY that needs to be sent, is transfered to the RubyStaker contract. All of this is done by the `_mintRubyRewards` internal function.

4. Additional admin/management functions have been added, for:

- Updating the address of the RubyStaker
- Emeregency witdrawing RUBY tokens

### Ruby Staking

The Ruby protocol features staking and locking functionality, which allows the users (RUBY holders) to stake and lock their tokens, and earn platform rewards. The staking and locking feature is forked from [Elipsis finance's EpsStaker contract](https://github.com/ellipsis-finance/ellipsis/tree/6bdf7788020695b72034f5c9f1fda11c5e3cefb7).
The staking and locking functionality is implemented by the RubyStaker contract. Additionally the rewards from the RubyMasterChef are paid by the RubyStaker contract.
The Lock period is 13 weeks.
Users that are staking their tokens are earning trading fees from the AMM exchange (the fee that is distributed via the RubyMaker contract), and also will be earning trading fees from the StablePool in the future.
Users that are locking their tokens are earning the same fees, but additionally they earn the penalty rewards, which are collected from the user's that do not want to wait their RubyMasterChef rewards to fully mature.

User rewards from the RubyMasterChef contract have a 3 month lock period, from the moment they are "set for vesting". The rewarded users can chose not to wait for 3 months and claim the rewarded tokens before that time, for a 50% penalty fee. If a user chooses not to wait, they will be able to claim only 50% of the rewarded tokens instantly, and the other half will be distributed to the users that have locked their tokens. The penalty amount is streamed to the locked users in the next one week (`rewardsDuration`).

The following changes have been made from The Elipsis finance's EpsStaker contract:

1. `rewardDistributors` mapping has been changed because we have two different types of rewards with the same reward token (RUBY). The first type of rewards are the RUBY rewards from the RubyMasterChef contract, while the second type of the rewards are from the `RubyMaker` contract and `RubyFeeSwapper` (in the future).
2. `rewardToken` has been added to the `Reward` struct, because of the same reason as above.
3. `setRewardMinter` function has been added as the `rewardMinter` has not been set in the constructor. Also there is only one `rewardMinter` in our architecutre. The `rewardMinter` is the RubyMasterChef contract.
4. Changes in the code to accomodate the `rewardDistributors` change, so that uint256 rewardIds are used instead of reward token addresses.

### Ruby Router

The Ruby Protocol enables swapping between different type of pools in a single transaction. Swaps between the AMM pools (Uniswap V2 pools) and the StablePools are enabled by using the `RubyRouter` contract. The RubyRouter contract receives a swap parameters which contain which swaps need to be executed and their order. All of the slippages for the swaps are calculated outside the contract, and the contract is just fed with the swap orders it needs to execute. The algorithm for the swaps that needs to be executed and their order, is calculated on our frontend. There are four different type of swaps enabled:

- AMM only, i.e ETH -> USDP (leveraging the UniswapV2Router only)
- StablePool only, i.e USDC -> USDT (leveraging the StablePool only)
- AMM to StablePool, i.e ETH -> USDC (leveraging the UniswapV2Router and the StablePool)
- StablePool to AMM, i.e USDT -> ETH (leveraging the StablePool and the UniswapV2Router).

Currently the base token on the AMM is USDP, and everything is routed through it. For example for the ETH -> USDC swap, the route looks like:

Swaps:
ETH -> USDP (AMM)
USDP -> USDC (StablePool)
Execution order:
[Amm, StablePool]

Upon performing a swap (the `swap` function), the `RubyRouter.sol` contract calls the `mintProfileNFT` function of the `NFTAdmin.sol` contract. This function mints a `ProfileNFT` to the transaction initiator (EOA - tx.origin), if the initiator does have balance of 0 `ProfileNFT`s.
The `RubyRouter` contract should be set as minter for the `NFTAdmin` contract.

### Ruby Token (RUBY)

The Ruby Token (`token_mappings/RubyToken.sol`) is the implementation of the Ruby token on the SChain. The `RubyTokenMainnet.sol` is the implementation on Ethereum mainnet.
Upon launch on mainnet, the total supply of the token (200M) will be minted to the deployer.
The implementation on the SChain is based on the SushiToken, but few things are changed:

1. AccessControl is implemented instead of Ownable. `DEFAUL_ADMIN_ROLE` is set to the deployer, while `MINTER` and `BURNER` roles should be set to the IMA bridge contracts by the deployer. The `BURNER` role should be set to the RubyMaker too, so that fee tokens can be burned.
2. Only the IMA bridge can mint tokens and IMA Bridge and the RubyMaker contract can burn tokens.

### NFTAdmin and RUBY NFTs

Ruby implements a custom NFT architecture to offer a better UX and more benefits to the users. The NFTs could be "earned" in various different ways, and also NFTs could have different benefits - ranging from purely for PFP showcase purposes, to various utilities accross the platform (swap fee reductions, reward boosts, etc).

Currently the NFT architecture involves three contracts:

1. `NFTAdmin.sol` - An admin contract that implements AMM trading fee deduction logic - if a user holds a RubyFreeSwapNFT, they're eligible for 0% fee AMM swaps. Additionally the NFTAdmin contracts enables ProfileNFT minting (via implemented restricted minter logic). The `mintProfileNFT` function of the `NFTAdmin.sol` contract is currently only being called from the `RubyRouter.sol` contract.
2. `ProfileNFT.sol` - ProfileNFT, currently minted upon doing swaps/trading actions, minted from the `RubyRouter.sol` contract.
3. `RubyFreeSwapNFT.sol` - RubyFreeSwapNFT - a utility NFT, used for providing fee free AMM swaps for it's holders.

## Upgradeability:

Some part of the Ruby contracts architecture is upgradeable. This is achieved by using the `TransparentUpgradeableProxy.sol` proxy and the `RubyProxyAdmin.sol` contract. The upgradeability is not explicitly implemented in the contracts, but it's achieved automatically in the deployment scripts (by using the hardhat-deploy library).

The following contracts are deployed to be upgradeable:

- `UniswapV2Router02.sol`
- `NFTAdmin.sol`
- `RubyRouter.sol`
- `RubyFreeSwapNFT.sol`
- `ProfileNFT.sol`
- `RubyStaker.sol`
- `RubyMaker.sol`
- `RubyMasterChef.sol`

## Forked codebases:

Sushiswap: https://github.com/sushiswap/sushiswap/tree/bef474629c6ab75f0efc511234f32d760db241aa

Saddle finance: https://github.com/saddle-finance/saddle-contract/tree/6f37f97b9600196c75416e2f579165e74906eb76

Trader Joe: https://github.com/traderjoe-xyz/joe-core/tree/ec25d93533427328c576c38e7987485ba0ffd27d

Elipsis finance: https://github.com/ellipsis-finance/ellipsis/tree/6bdf7788020695b72034f5c9f1fda11c5e3cefb7
