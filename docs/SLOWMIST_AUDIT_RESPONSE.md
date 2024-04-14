# SlowMist audit response

This document should serve as a response to the SlowMist audit report, which can be found in the `/docs` directory.

### Reported issues:

1. **[N1] [Suggestion] \_convert execution may keep failing**
   Origin smart contract: `contracts/RubyMaker.sol`
   Status: Fixed
   Commit: https://github.com/RubyExchange/backend/pull/12/commits/f1b8b10a073361a356b93676c8f8542c8853172d

2. **[N2] [Low] Unexpected swap fees**
   Origin smart contract: `contracts/amm/UniswapV2Pair.sol`
   Status: Fixed
   Commit: https://github.com/RubyExchange/backend/pull/12/commits/7e38b0471609e2cc102f78807a2cc31aff8cb750

3. **[N3] [Suggestion] DoS issue**
   Origin smart contract: `contracts/RubyStaker.sol`
   Status: Fixed
   Commit: https://github.com/RubyExchange/backend/pull/12/commits/a1c31ffa30ce55b643e026552da7819f6cfbcf40

4. **[N4] [Suggestion] unused variable**
   Origin smart contract: `contracts/amm/UniswapV2Factory.sol`
   Status: Fixed
   Commit: https://github.com/RubyExchange/backend/pull/12/commits/b8a63eaada4f94d446c8ca4d0cb0a6cf1b4082f6

5. **[N5] [Suggestion] Computational precision problem**
   Origin smart contract: `contracts/RubyStaker.sol`
   Status: Not fixed, acknowledged
   Comment: The computational precision problem noted for this issue is not problematic in our project.
   The precission loss leads to withdrawal time grouping. Additionally this part of the code is forked from Geist/Elipsis finance
   smart contracts codebase which has been in production for some time, and also audited multiple times.

6. **[N6] [Suggestion] Missing event record**
   Origin smart contract: `contracts/ruby_router/RubyRouter.sol`
   Status: Fixed
   Commit: https://github.com/RubyExchange/backend/pull/12/commits/976ce01f58ae6c3f5c79485b727f0b1347866c07
   https://github.com/RubyExchange/backend/pull/12/commits/b2711d87edd300b7f325e4bfdfdbfabe98c54e3a

7. **[N7] [Low] Risk of excessive authority**
   Origin smart contracts: `contracts/RubyMaker.sol`, `contracts/RubyStaker.sol`, `contracts/RubyMasterChef.sol`, `contracts/NFTAdmin.sol`,
   Status: Not fixed, acknowledged
   Comment: The excessive authority is necessary for black swan events scenarios. Additionally we plan the smart contracts owner to be a multisig with a certain threshold, where the signers would be different parties. Additionally we plan to put the contracts above, as well as some other contracts from our architecture behind a timelock contract with a reasonable delay period between proposals and execution.

8. **[N8] [Low] Deflationary tokens are not compatible**
   Origin smart contracts: `contracts/RubyMasterChef.sol`
   Status: Not fixed, acknowledged
   Comment: We are aware of this issue and we do not plan to support deflationary tokens that can impact the rewards, nor deflationary LP tokens.
