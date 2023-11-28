# Ruby protocol fee structure, fee and reward distributions

This document outlines various forms of fees present in the Ruby protocol.

## Fee structure
1. AMM

Dynamic swap fee - 30 BIPS or 0 BIPS, depending on the holdings of RubyFreeSwapNFT of the swap initiator. 
If fee is applied, 83% of the 30 BIPS  of the trading fee goes to the liquidity providers, while 17% is sent to the RubyMaker contract as a protocol fee. 

## Fee distribution
1. NFTStaker

The AMM trading fees are sent to the NFTStaker contract for fee distribution in the form of LP tokens (because of how the Uniswap architecture works). 
80% of these fees are distributed to the NFT stakers (sent to the NFTStaker.sol contract)

