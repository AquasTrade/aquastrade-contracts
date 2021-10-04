## Usage guide

#### Install:

`yarn`

#### Deployment:

1. `yarn deploy --tags UniswapV2Factory`
2. `yarn deploy --tags UniswapV2Router02`
3. `yarn deploy --tags WETH`
4. `yarn deploy --tags USDC`
5. `yarn deploy --tags USDT`
6. `yarn deploy --tags MockERC20s`
7. `yarn deploy --tags RubyToken`
8. `yarn deploy --tags RubyMasterChef`
9. `yarn deploy --tags Timelock`
10. `yarn deploy --tags RubyMine`
11. `yarn deploy --tags RubyDigger`
12. `yarn deploy --tags Multicall2`
13. `yarn deploy --tags rubyUSDC`
14. `yarn deploy --tags t721`
15. `yarn deploy --tags rubyT721`
16. `yarn deploy --tags tERC20`

#### Debug:

Modify the `scripts/debug.js` scripts and run `yarn debug`.
TODO: Add yargs and run debug commands from command line.

#### Init code hash:

`0x6fe8e87a28fb716b3653927f8a6b2ad33dddb1b9c53ed3d5428dc4572f8b42bc`

#### Deployment addresses:

```
SKALE testnet:

{
    UniswapV2Factory: '0x5dDB659DAb3bd16aE30EfF4C92Ca09Ca733e4e52',
    UniswapV2Router: '0xd3146010de7599EC06a0F471Bb2b5A2d96F4c044',
    fUNI: '0x38105Ed6DBBF5519b5DB79165aAAdBfc3c1fBE19',
    fDAI: '0x5d8c7C41E50859Fd56b40260b0Be2Fe328C76110',
    WETH: '0xa5F7FAA75420ABd989831cd75b18C0828bfbc9f0',
    RubyToken: '0x0DE3bf35C1b87A493286BD111627d2877d72c051',
    RubyMasterChef: '0x0a80Fc789e94e9fd66d60404C67de6c9E17327b5',
    RubyMine: '0x92D01eef0be51957dE2f57DCb5Debb1A42b5b47e',
    RubyDigger: '0x7A7610750Dd0eA5c0247f46966355a5248fb3335',
    Multicall2: '0x8e8cEeD240B0dDE52AD9c2805a730bEaCf7cA216',
    rubyUSDC: '0x87d61e9f346330d5F8Bb5D3fCc30f8E35d01df33', // bridged USDC
    ETHC: '0xD2Aaa00700000000000000000000000000000000' // bridged ETH
}

```
