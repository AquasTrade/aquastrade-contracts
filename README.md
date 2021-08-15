## Usage guide

#### Install: 

`yarn`

#### Deployment:
1. `yarn deploy --tags UniswapV2Factory`
2. `yarn deploy --tags UniswapV2Router02`
3. `yarn deploy --tags DummyTokens`
4. `yarn deploy --tags SushiToken`
5. `yarn deploy --tags MasterChef` // TODO: should we deploy minichef only?
6. `yarn deploy --tags MiniChefV2`
7. `yarn deploy --tags SushiBar`
8. `yarn deploy --tags SushiMaker`
9. `yarn deploy --tags Multicall2`
9. `yarn deploy --tags rubyUSDC`

#### Debug:

Modify the `scripts/debug.js` scripts and run `yarn debug`.
TODO: Add yargs and run debug commands from command line.


#### Init code hash:
`0x8a1861e3cef8b973c5cfa3a2fb2e737ecf0ffd9dbf7c0acedd82a54ebeb01c94`

#### Deployment addresses: 

```
SKALE testnet:

{
    UniswapV2Factory: '0x5dDB659DAb3bd16aE30EfF4C92Ca09Ca733e4e52',
    UniswapV2Router: '0xd3146010de7599EC06a0F471Bb2b5A2d96F4c044',
    fUNI: '0x38105Ed6DBBF5519b5DB79165aAAdBfc3c1fBE19',
    fDAI: '0x5d8c7C41E50859Fd56b40260b0Be2Fe328C76110',
    WETH: '0xa5F7FAA75420ABd989831cd75b18C0828bfbc9f0',
    SushiToken: '0x4a1C2A42084B3F9DFB8eBADB66918111932613d0',
    MasterChef: '0xEf36C60Df5C894A77A43578C6535007C5cEEd290',
    MiniChefV2: '0xfbb8E64b4CA4459Dd38Dc732A59c53B7a3DD0E5a',
    SushiBar: '0x374264b48cE947F989DE7A2f77cEbDc8bC051735',
    SushiMaker: '0x8644C20360018F2DA8b854253724caE97DB1B99E',
    Multicall2: '0x8e8cEeD240B0dDE52AD9c2805a730bEaCf7cA216',
    rubyUSDC: '0x87d61e9f346330d5F8Bb5D3fCc30f8E35d01df33', // bridged USDC
    ETHC: '0xD2Aaa00700000000000000000000000000000000' // bridged ETH
}

```