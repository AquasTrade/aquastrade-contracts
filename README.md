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
  prints pools 

## Installation
```nvm use v14.19.2```
```yarn install```
```yarn compile```
```yarn initCodeHash --network stagingv3```
```yarn initCodeHash --network europa```

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
- test scripts should work 
