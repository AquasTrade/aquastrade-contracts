# README

Please check out the `docs` directory for more info.

## Addresses

Deployer
* L1,L2: `0xCDeb7F7974D89Fd71089487D65AA9731d7E846F5`

Router
* Router : `0x698EA133CBA3BACD4aA6405411d8e8c1726D5f61`

Factory
* factory : `0xc318a82CB7c2B0faf7e355BB8F285016956aBF55`


## Quickstart

* testing  
  `$ npx hardhat test --network hardhat test/nfts/RubyNFT.test.ts`
* interactive console  
  `$ npx hardhat console --network stagingv3`

## Useful Debugging and Maintenance Commands

* `yarn rubyStatus --network europa`  
  prints pools 

* `npx hardhat balances --network europa --address 0xCDeb7F7974D89Fd71089487D65AA9731d7E846F5`  
  prints the balances of native and a number of tokens of the supplied address




# SKALE SWAP 



## Aqua Dex 
```nvm use v14.19.2```
```yarn install```
```yarn compile```
```yarn initCodeHash --network stagingv3```
```yarn initCodeHash --network europa```

This code should be set at: `contracts/amm/libraries/UniswapV2Library.sol` at line 33, where the "// init code hash" comment is set. (NOTE: without the `0x` symbol)

```yarn deploy --network stagingv3 --tags UniswapV2Factory```
```yarn deploy --network stagingv3 --tags UniswapV2Router02```

- sends to Aqua Deployer
```yarn deploy --network stagingv3 --tags SeedRubyProfileNFT```

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

## Setup the NFT's in NFTAdmin
GoldSwapNFT is initialized at deployment, therefore admin needs to set Bronze and Silver NFT Addresses 
- ```yarn deploy --network europa --tags SetNFTs```

- ```yarn deploy --network europa --tags MarketPlace-ETH```

## Games 
- ```npx hardhat test --network hardhat test/CoinFlip.test.ts```
- ```yarn deploy --network europa --tags RNG```
- ```yarn deploy --network europa --tags CoinFlip```

### more 

-  `npx hardhat run scripts/verify/verifyRubyContracts.ts --network europa`
- ```yarn aqua-dex --network europa```


# setting up AMM pools 
- only 18 decimal - no WBTC , no USDC, or USDT 
- AQUA - USDP 
- AQUA - DAI 
- AQUA = 0.01 USD , 100 AQUA = $1.00 

# forgot to change the pairs.sol contract name. Ruby LP ==> its fine, just shows that its a fork =) 

