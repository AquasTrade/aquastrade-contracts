If you are looking for a Uniswap v2 that is required for an EVM chain with native free gas (Native token has no value and does not require any wrapping or interaction with smart contracts besides being the gas used to execute transactions). Designed for Skale.Space : Skale Network (modular l2 side chains that are scaling ethereum).


# README

Please check out the `docs` directory for more info.

## Addresses

Deployer
* L1,L2: `0xCDeb7F7974D89Fd71089487D65AA9731d7E846F5`

Router
* Router : `0x698EA133CBA3BACD4aA6405411d8e8c1726D5f61`
* AquasRouter : `0x18425939A31E35DB05358Ba4Bc85d1075ed015E5`

Factory
* factory : `0xc318a82CB7c2B0faf7e355BB8F285016956aBF55`


## Quickstart

* testing  
  `$ npx hardhat test --network hardhat test/CoinFlip.test.ts`
* interactive console  
  `$ npx hardhat console --network stagingv3`

## Useful Debugging and Maintenance Commands

* `yarn aquaStatus --network europa`  
  prints pool addresses in array 
* `yarn aqua-dex --network europa`  
  prints pools with deployer's balance

## Installation
- ```nvm use v14.19.2```
- ```yarn install```
- ```yarn compile```
- ```yarn initCodeHash --network stagingv3```
- ```yarn initCodeHash --network europa```

This code should be set at: `contracts/amm/libraries/UniswapV2Library.sol` at line 33, where the "// init code hash" comment is set. (NOTE: without the `0x` symbol)

## Europa Mainnet 
- ```yarn deploy --network europa --tags UniswapV2Factory```
- ```yarn deploy --network europa --tags UniswapV2Router02```
- ```yarn deploy --network europa --tags SeedAMM```
- ```yarn deploy --network europa --tags SeedNFTAdmin```
- ```yarn deploy --network europa --tags SeedProfileNFT```
- ```yarn deploy --network europa --tags GoldSwapNFT```
- ```yarn deploy --network europa --tags SilverSwapNFT```
- ```yarn deploy --network europa --tags BronzeSwapNFT```

- ```yarn deploy --network europa --tags SeedGoldNFT```
- ```yarn deploy --network europa --tags SeedSilverNFT```
- ```yarn deploy --network europa --tags SeedBronzeNFT```

- ```yarn deploy --network europa --tags Multicall2```

- ```yarn deploy --network europa --tags AquasRouter```
- ```yarn deploy --network europa --tags SeedAquasRouter```

## Setup the NFT's in NFTAdmin
GoldSwapNFT is initialized at deployment, therefore admin needs to set Bronze and Silver NFT Addresses 
- ```yarn deploy --network europa --tags SetNFTs```

- ```yarn deploy --network europa --tags MarketPlace-ETH```

## Games 
- ```npx hardhat test --network hardhat test/CoinFlip.test.ts```
- ```yarn deploy --network europa --tags RNG```
- ```yarn deploy --network europa --tags CoinFlip```

### more 

-  ```npx hardhat run scripts/verify/verifyRubyContracts.ts --network europa```
- ```yarn aqua-dex --network europa```


# todo before launch
- add : https://github.com/Vectorized/NFTStaker


# AQUA erc20 token 
- 200 million 
- deflationary from protocol fees : burn $AQUA 
- all pools use AQUA as base_asset to concentrate liquidity
## Concentrated liquidity without fragmentation
``` bash 
Pair addr (LP Token): 0xb557f7FefB85Da2534F299409e02795447d17158
Pool ID: 0
Token 0: USDP@0x73d22d8a2D1f59Bf5Bcf62cA382481a2073FAF58
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867

Pair addr (LP Token): 0xc43c634C95326681ff40A6E49e0fD6D034EF7ae4
Pool ID: 1
Token 0: DAI@0xD05C4be5f3be302d376518c9492EC0147Fa5A718
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867

Pair addr (LP Token): 0xe25cCE2CF839F944e0880d6A29CF15A0b87fe01d
Pool ID: 2
Token 0: EXD@0xCfEBA92BD362B2F76fC30a89C433DE50a1D62BcA
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867
## ETH-AQUA
Pair addr (LP Token): 0x670eD7CB5C405b801a1325aa939498bA10F43DC8
Pool ID: 3
Token 0: ETHC@0xD2Aaa00700000000000000000000000000000000
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867

Pair addr (LP Token): 0x886BBa4166266e1CD8a655025A37aBFa53d4124d
Pool ID: 4
Token 0: SKL@0xE0595a049d02b7674572b0d59cd4880Db60EDC50
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867

Pair addr (LP Token): 0x84a5dDeB532627DF79a9Fa571Fa9BC782651a733
Pool ID: 5
Token 0: BRAWL@0x28c6ac22aB738BB01FC6CBA75804dC088aae6193
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867

Pair addr (LP Token): 0x628d3879c7dd1da534B75010bCd24E74A537783e
Pool ID: 6
Token 0: PROSPECT@0xA30cA600b8E722E2513B7738493F410a6Ae4a373
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867

Pair addr (LP Token): 0x2e46879695b79543E9458A564d7497a3c9Ee0A47
Pool ID: 7
Token 0: SKILL@0xBDDad45160E10C3738785d9dD7F30b4B2a5Eeba8
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867

Pair addr (LP Token): 0x65b008BAa2F6C088a9bc4e3028056ACcB90Be0cF
Pool ID: 8
Token 0: TGOLD@0x9F26f887307986CBC2BA53BFf9A8E2e5Da61D1f8
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867

Pair addr (LP Token): 0xDE803771Bb6f1E88922548f2AB3AE6e77977EbFb
Pool ID: 9
Token 0: USDC@0x5F795bb52dAC3085f578f4877D450e2929D2F13d
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867

Pair addr (LP Token): 0xA3f036B80231Fbe5c83616224960aa5E9202889b
Pool ID: 10
Token 0: USDT@0x1c0491E3396AD6a35f061c62387a95d7218FC515
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867

Pair addr (LP Token): 0x8D920361D58b8D091Ce4C53b29255bb5c578F014
Pool ID: 11
Token 0: RUBY@0x2B4e4899b53E8b7958c4591a6d02f9C0b5c50F8f
Token 1: AQUA@0xE34A1fEF365876D4D0b55D281618768583ba4867
## Test pool : no liquidity 
Pair addr (LP Token): 0x4B39C70e47702f5CFACfF3FDE8166363B529cc45
Pool ID: 12
Token 0: RUBY@0x2B4e4899b53E8b7958c4591a6d02f9C0b5c50F8f
Token 1: USDP@0x73d22d8a2D1f59Bf5Bcf62cA382481a2073FAF58
```