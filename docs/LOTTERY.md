# Lottery Scripts

1. Create a New Lottery

```
yarn createLottery --nftaddress $nftAddress --nftid $nftid --size $size --price $price --distribution $distribution --duration $duration --mint $mint
```

The arguments are (**ADDRESS EXAMPLES ON FANCY**)

* `$collateral`: Address of collateral token.
  * `0x83B38f79cFFB47CF74f7eC8a5F8D7DD69349fBf7` RUBY
  * `0x76A3Ef01506eB19D6B34C4bDcF3cDcdE14F6B11E` USDP
* `$nftAddress`: Address of bonus NFT.
  * `0x0000000000000000000000000000000000000000` for no NFT
  * `0xd80BC0126A38c9F7b915e1B2B9f78280639cadb3` e.g. FreeSwap NFT on fancy
* `$nftid`: Token ID of bonus NFT.
  * This has no meaning if `mint=1`
* `$size`: Digit count of ticket.
* `$price`: Cost per ticket in $collateral.
* `$distribution`: An array string defining the distribution of the prize pool.(e.g. "[40, 25, 10, 5, 20]"). The elements of the array are
  * `[0:-2]`: winner 1, winner 2, ...
  * `[-2]`: burn percentage
  * `[-1]`: percentage to the treasury
  * `$duration`: The duration in second until no more tickets will be sold for the lottery from now.(e.g. `7200` for 2 hours)
* `$mint`: `1` for mint

e.g 
```
yarn createLottery --network rubyNewChain --collateral 0x83B38f79cFFB47CF74f7eC8a5F8D7DD69349fBf7 --nftaddress 0xd80BC0126A38c9F7b915e1B2B9f78280639cadb3 --nftid 0 --size 4 --price 10000000000000000000 --distribution "[40, 25, 10, 5, 15, 5]" --duration 1200 --mint 1

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
