# protocol fee structure, fee and reward distributions

This document outlines various forms of fees present in the Aquas.Trade protocol.

## Fee structure

1. AMM

Dynamic swap fee - 30, 20, 10, or 0 BIPS, depending on the NFT tier of the swap initiator.

- No NFT : 30 BIPS
- BronzeNFT : 20 BIPS
- SilverNFT : 10 BIPS
- GoldNFT : 0 BIPS

If fee is applied, 83% of the 30 BIPS of the trading fee goes to the liquidity providers, while 17% is sent to the Dev Fund Treasury as a protocol fee.

