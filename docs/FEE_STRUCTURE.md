# Ruby protocol fee structure, fee and reward distributions

This document outlines various forms of fees present in the Ruby protocol.

## Fee structure
1. AMM

Dynamic swap fee - 30 BIPS or 0 BIPS, depending on the holdings of RubyFreeSwapNFT of the swap initiator. 
If fee is applied, 83% of the 30 BIPS  of the trading fee goes to the liquidity providers, while 17% is sent to the RubyMaker contract as a protocol fee. 

2. Stable swap

4 BIPS trading fee at the stable pool, distributed to the stable pool liquidity providers. 0 Admin fee currently. 

## Fee distribution
1. RubyMaker

The AMM trading fees are sent to the RubyMaker contract for fee distribution in the form of LP tokens (because of how the Uniswap architecture works). 
80% of these fees are distributed to the Ruby token stakers (sent to the RubyStaker.sol contract), 
while the 20% of the tokens are burned.

The RubyMaker contract needs to be invoked manually in order to convert the LP tokens into RUBY.

2. RubyStaker

Protocol fees are distributed to RUBY lockers and RUBY stakers. These actions are available at the RubyStaker contract.
Percentage of  the AMM trading fees are distributed to RUBY stakers and lockers, while reward distributions penalty fees (50% of the claimable rewards)
are distributed to RUBY lockers only. 
Harvested RUBY rewards are subject to 3 month lock period. The users can decide to claim their rewards instantly, for a 50% penalty fee of their rewards

## Rewards distribution
1. RubyMasterChef

Users can stake their LP tokens at the RubyMasterChef to earn rewards. Depending on the incentive structure of the protocol, 
RUBY trading rewards would be set for different pools. Additionally the RubyMasterChef supports double rewards.
The RubyMasterChef rewards are distributed via the RubyStaker contract, 
they are locked for a certain period of time before the LP stakers can claim their rewards.
The stakers need to manually invoke the harvest action, from which the lock period starts.