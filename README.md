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
10. `yarn deploy --tags RubyMine`
11. `yarn deploy --tags RubyDigger`
12. `yarn deploy --tags Multicall2`
13. `yarn deploy --tags MappedERC20`
14. `yarn deploy --tags Mapped721`


#### Init code hash:

`0xe14a5d38633264eaf4ed6f00cb96aa46e94bc6c69875cfe6d6ae2d1f76eb4452`

#### Deployment addresses:

```
SKALE testnet:

Contracts: 

{
    UniswapV2Factory: '0x605C0c28e61d027314791Bbdc8F7A0A2FaaA66e4',
    UniswapV2Router: '0x6fC745027a232a0D7415F964da9BAd32615657e2',
    WETH: '0x2f5c0B8DF7f15dbEF9dEbeb20cf2916Cbff022Bf',
    USDC: '0x370eFEEa88927fe4532C6cC16193f41c9917fb20',
    USDT: '0xC30cE3E3616e90dA0459Fc2e84636A6e2974aE31',
    RubyToken: '0x24EbCCc52300e19bf99575840CA4aD3f64Cfd219',
    RubyMasterChef: '0x1b1Bd64d00b7e54e90Eb96D8233B32DD6eF690a1',
    RubyMine: '0x0',
    RubyDigger: '0x0',
    Multicall2: '0x0',
    rubyUSDC: '0x0', // bridged USDC
    ETHC: '0xD2Aaa00700000000000000000000000000000000' // bridged ETH
}

LPs:

{
    rubyUsdc: '0x96f6C3CBA18c27907071062aA9Cb6438a21Cf83d',
    rubyUsdt: '0x0D400c840c2F85f91847EF518f9F9a02f16d8DF1',
    usdtUsdc: '0xe8C9E84b1cB73229E1AfEcB5fea4bc31285624D7',
    usdcWeth: '0x6816475f9ddc982D5f84e9aaec725c167617E2fe',
    usdtWeth: '0x485E45ACd41f9764EAf4Df7e2D7DC00f0667B068',
    rubyWeth: '0xbd756ed2C0B59Ecb9181A28e924A7C73d0a6dd51'
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
