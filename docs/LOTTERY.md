# Lottery Scripts

1. Create a New Lottery

```
yarn createLottery --nftaddress $nftAddress --nftid $nftid --size $size --price $price --distribution $distribution --duration $duration --mint $mint
```

The arguments are

* `$nftAddress`: Address of bonus NFT.(e.g. 0x431638081e7F63D90E1bED5f15f6BFfed09C9597)
* `$nftid`: Token ID of bonus NFT.(This has no meaning if `mint=1`)
* `$size`: Digit count of ticket.
* `$price`: Cost per ticket in $ruby.
* `$distribution`: An array string defining the distribution of the prize pool.(e.g. "[40, 25, 10, 5, 20]"). The elements of the array are
  * `[0:-2]`: winner 1, winner 2, ...
  * `[-2]`: burn percentage
  * `[-1]`: percentage to the treasury
  * `$duration`: The duration in second until no more tickets will be sold for the lottery from now.(e.g. `7200` for 2 hours)
* `$mint`: `1` for mint

e.g 
```
yarn createLottery --network rubyNewChain --nftaddress 0xd80BC0126A38c9F7b915e1B2B9f78280639cadb3 --nftid 0 --size 4 --price 10000000000000000000 --distribution "[40, 25, 10, 5, 15, 5]" --treasury 0xC3A46A18e6CB5bB8980EcbeCBd675B4D931FC4C0 --duration 7200
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
