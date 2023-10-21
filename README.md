# README

Please check out the `docs` directory for more info.

## Addresses

Deployer
* L1,L2: `0xCDeb7F7974D89Fd71089487D65AA9731d7E846F5`

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




# SKALE SWAP 



## Aqua Dex 
```nvm use v14.19.2 ```
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

- ```yarn aqua-dex --network europa```

# setting up AMM pools 
- only 18 decimal - no WBTC , no USDC, or USDT 
- AQUA - USDP 
- AQUA - DAI 
- AQUA = 0.01 USD , 100 AQUA = $1.00 

# forgot to change the pairs.sol contract name. Ruby LP ==> its fine, just shows that its a fork =) 

