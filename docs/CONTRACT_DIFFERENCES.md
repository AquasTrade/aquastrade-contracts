# Contract differences

This document outlines the differences from the forked contracts. This is a TL;DR version of the `ARCHITECTURE.md` document,
for more details please check [ARCHITECTURE.md](./ARCHITECTURE.md)

## Forked contracts

We've forked the following contracts/contract achitectures:

1. Uniswap V2 AMM (amm), forked from rubyexchange:
   https://github.com/RubyExchange/contracts/tree/master

## Contract differences

1. Uniswap V2 AMM:

- RouterV2 and FactoryV2: Permissionless
- RouterV2 and Library: Dynamic trading fee applied depending on the message sender (more concretely the NFT holdings of a message sender: with 3 different swap fee tier)
