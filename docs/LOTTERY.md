# Lottery Scripts

1. Create a New Lottery

```
yarn createLottery --nftaddress $nftAddress --nftid $nftid --size $size --price $price --distribution $distribution --duration $duration --mint $mint
yarn createLottery --collateral $collateral --nft $nft --nftid $nftid --size $size --price $price --distribution $distribution --duration $duration --mint $mint
```

The arguments are

* `$collateral`: Name of collateral token symbol, e.g.
  * `RUBY`
  * `USDP`
* `$nft`: Name of NFT
  * `none` for no NFT
  * `RubyFreeSwapNFT`
  * `RubyProfileNFT`
* `$nftid`: Token ID of bonus NFT.
  * This has no meaning if `mint=1`
* `$size`: Digit count of ticket.
* `$price`: Cost per ticket in $collateral. Human number (it is parsed correctly according to collateral decimals)
* `$distribution`: An array string defining the distribution of the prize pool.(e.g. "[40, 25, 10, 5, 20]"). The elements of the array are
  * `[0:-2]`: winner 1, winner 2, ...
  * `[-2]`: burn percentage
  * `[-1]`: percentage to the treasury
  * `$duration`: The duration in second until no more tickets will be sold for the lottery from now.(e.g. `7200` for 2 hours)
* `$mint`: `1` for mint

e.g 
```
yarn createLottery --collateral USDP --nft RubyFreeSwapNFT --nftid 0 --size 3 --price 7 --distribution "[50, 15, 10, 5, 15, 5]" --duration 300 --mint 1

```
1. Draw Lottery

```
yarn drawLottery --lotteryid $lotteryID
```

`$lotteryID`: Lottery Number to draw. 0 for current(latest) Lottery.

e.g
```
yarn drawLottery --lotteryid 0
```
