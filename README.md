## Usage guide

#### Install:

`yarn`

#### Deployments:

1. `yarn deploy --tags UniswapV2Factory`
2. `yarn deploy --tags UniswapV2Router02`
3. `yarn deploy --tags WETH`
4. `yarn deploy --tags USDC`
5. `yarn deploy --tags USDT`
6. `yarn deploy --tags MockERC20s`
6. `yarn deploy --tags Mock721`
7. `yarn deploy --tags RubyToken`
8. `yarn deploy --tags RubyMasterChef`
9. `yarn deploy --tags Timelock`
10. `yarn deploy --tags RubyBar`
11. `yarn deploy --tags RubyMaker`
12. `yarn deploy --tags Multicall2`
13. `yarn deploy --tags MappedERC20`
14. `yarn deploy --tags Mapped721`
15. `yarn deploy --tags USDP`


#### Init code hash:

`0x6fe8e87a28fb716b3653927f8a6b2ad33dddb1b9c53ed3d5428dc4572f8b42bc`

#### Deployment addresses:

``` Rinkeby
    USDC: 0xF7Ef09660B71fD18A56AA913207Ebfa6727874C1
    USDT: 0x2Fc800Cf8c219DD07866f883F8f25a346F92d07b
    USDP: 0x3595E2f313780cb2f23e197B8e297066fd410d30
```

```
SKALE testnet:

Contracts: 

{
    UniswapV2Factory: '0x616A779E70D4FbD1b53f60eB12c5377a5b451A9a',
    UniswapV2Router: '0x1a4bB43E128efA4b55B2C4D8BF1c991E24921eb6',
    WETH: '0xf6dFABa1C203f403D6e1116d246e3139654C315E',
    USDC: '0x95bdEd8476bCe6dE791224d2663fb9259778c80c',
    USDT: '0x6D90AB0bB745B9a6CF8a7989f9fB38Bb7efC464d',
    USDP: '0xdA5E2Ee40DE7b265C28B2028E6e1e568fa4Cf66e',
    RubyToken: '0x2D76E3E55bB9E573af26043fb0c76cbbfAC95a2c',
    RubyMasterChef: '0x2090EbdE28485c67D4Fe69c47740d91144A14203',
    RubyBar: '0x0',
    RubyMaker: '0x0',
    Multicall2: '0x74a5cb6b214a8311BA3a682b3d129D0d4cD1fdC8',
    rubyUSDC: '0x0', // bridged USDC
    ETHC: '0xD2Aaa00700000000000000000000000000000000' // bridged ETH
}

LPs:

{
    rubyUsdc: '0x98a211F97e7D99017C50b343CaeF7aa3AA49cFCC',
    rubyUsdt: '0x1a3A8d08E6aB39Fe76B0b24741f619264B8Acb89',
    usdtUsdc: '0x16e7f40cD9b0d41D80798d31d6DC45224Af26c69',
    usdcWeth: '0x44343e87C42b55A99F866d971eb47736FB7CBB18',
    usdtWeth: '0x3ea1892c000B9932AfCDa2c584061B6811e98576',
    rubyWeth: '0xa7676Fff6250046EF557B7c4Adc45567b73eAe56',
    rubyUsdp: '0x9f007f39Cd56790ad5b89aF0eaBf8CD8C4a4f160'
}

```

### Quick deployment and seeding (for testing)

#### Exchange:

1. `yarn deploy --tags RubyToken`
2. `yarn premint`
3. `yarn createRubyStablePools`

or `./automation_scripts/deploy_and_seed_exchange.sh`

#### MasterChef:

1. `yarn deploy --tags RubyMasterChef`
2. `yarn seedMasterChef`

or `./automation_scripts/deploy_and_seed_masterchef.sh`

### Staking:

1. `yarn deploy --tags RubyMaker`
2. `yarn setTradingFee` # sets the RubyMaker to be the fee receiver from the exchange trades (UniswapV2Factory)
3. `yarn setMakerAllowance` # sets allowance for the RubyMaker to be able to burn Ruby tokens

or `./automation_scripts/deploy_and_seed_staking.sh`