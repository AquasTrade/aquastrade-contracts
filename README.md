## Usage guide

#### Install:

`yarn`

#### Local setup:

Start local chain:

`yarn chain`

#### Deployments:

The default network specified in `hardhat.config.ts` would be used for the deployments. This can be either overriden in the file, or by adding `--network {NETWORK}`, e.g:

`yarn deploy --tags WETH --network skaleTestnet`

##### Mock tokens:

1. `yarn deploy --tags MockUSDC`
2. `yarn deploy --tags MockUSDP`
3. `yarn deploy --tags MockUSDT`
4. `yarn deploy --tags MockDAI`

or

`yarn deploy --tags MockTokens`

##### Mapped tokens (L2):

1. `yarn deploy --tags RubyUSDC`
2. `yarn deploy --tags RubyUSDP`
3. `yarn deploy --tags RubyUSDT`
3. `yarn deploy --tags RubyDAI`

or

`yarn deploy --tags MappedTokens`

##### RubyToken:

1. `yarn deploy --tags RubyTokenMainnet` # L1 (i.e Mainnet, Rinkeby)
   or
2. `yarn deploy --tags RubyToken` # L2 (i.e Skale, Skale testchain)

##### AMM:

1. `yarn deploy --tags WETH`
2. `yarn deploy --tags UniswapV2Factory`
3. `yarn deploy --tags UniswapV2Router02`

or

`yarn deploy --tags AMM`

#### Ruby Staking (xRUBY):

1. `yarn deploy --tags RubyBar`
2. `yarn deploy --tags RubyMaker`

or

`yarn deploy --tags Staking`

##### Farm:

1. Deploy ruby token if not deployed `yarn deploy --tags RubyTokenMintable` or `yarn deploy --tags RubyToken`
2. Deploy RubyMasterChef `yarn deploy --tags RubyMasterChef`
3. Seed RubyMasterChef with RUBY tokens `yarn transferRubyTokensToMasterChef`

##### Stable swap:

1. `yarn deploy --tags Allowlist`
2. `yarn deploy --tags AmplificationUtils`
3. `yarn deploy --tags SwapUtils`
4. `yarn deploy --tags LPToken`
5. `yarn deploy --tags SwapDeployer`
6. `yarn deploy --tags Swap`
7. `yarn deploy --tags USD4Pool`

or

`yarn deploy --tags StableSwap`

##### Ruby router:

1. `yarn deploy --tags RubyRouter`

##### Utils:

1. `yarn deploy --tags Multicall2`

##### Governance:

1. `yarn deploy --tags Timelock`

---

#### Init code hash:

`0x0a7459fd509713423fae10bc598e33f725397f71fd0785bbecc2a4745e162beb`

---

#### Deployment addresses:

##### Rinkeby:

```
    USDC: 0xF7Ef09660B71fD18A56AA913207Ebfa6727874C1
    USDT: 0x2Fc800Cf8c219DD07866f883F8f25a346F92d07b
    USDP: 0x3595E2f313780cb2f23e197B8e297066fd410d30
    RubyToken: 0xbB65c7911db2545D9f99eb5AC8E3178Cebb5CaFd
```

##### SKALE testnet:

```
Contracts:
{
    UniswapV2Factory: '0x622311A7E32f3dD209C86f5Fe522BcEdbbAbFB8c',
    UniswapV2Router: '0x7d18D7C457459148Ab1ad7423bCD7F2689B072a3',
    WETH: '0x5A330804f80151DaC73969Acc4387527E437004c',
    USDC: '0x95bdEd8476bCe6dE791224d2663fb9259778c80c',
    USDT: '0x6D90AB0bB745B9a6CF8a7989f9fB38Bb7efC464d',
    USDP: '0xdA5E2Ee40DE7b265C28B2028E6e1e568fa4Cf66e',
    RubyToken: '0xF97048222D434e7A1a83e57462a3B0aaB626313d',
    RubyMasterChef: '0x2090EbdE28485c67D4Fe69c47740d91144A14203',
    RubyBar: '0x0',
    RubyMaker: '0x0',
    Multicall2: '0x74a5cb6b214a8311BA3a682b3d129D0d4cD1fdC8',
    rubyUSDC: '0x0', // bridged USDC
    ETHC: '0xD2Aaa00700000000000000000000000000000000' // bridged ETH
}

LPs:
{
    usdcUsdt: '0xAAaEe87F8F7bEf70f0755874760E1f64005012B1',
    usdcUsdp: '0x06072351e4d6d36C05ca9a562Ca876932De9699f',
    usdtUsdp: '0x6cE9C57Fe5b680F5e132c369715554087dFCec9d',
    usdcEthc: '0x13c4398BB59F7CE12Fd58a2ae307E8Ca08fB51D5',
    usdcRuby: '0xDFE344A7650da6007933D472D1639250Ece58594'
    usdtEthc: '0x82D747306CfBEc02989AA608BF5FE7145dCF2e47',
    usdpEthc: '0xA443b6204946b929147CEbF79482c8A1D6b01117'
    rubyEthc: '0x2b7cD677Ccb6e5D03179f582737B8d0AB743615F'
}

```

### Quick deployment and seeding (for testing) - OUTDATED

#### AMM:

1. `yarn deploy --tags RubyToken`
2. `yarn premint`
3. `yarn createRubyStablePools`

or `./automation_scripts/deploy_and_seed_exchange.sh`

#### MasterChef:

1. `yarn deploy --tags RubyMasterChef`
2. `yarn seedMasterChef`

or `./automation_scripts/deploy_and_seed_masterchef.sh`

#### Staking:

1. `yarn deploy --tags RubyMaker`
2. `yarn setTradingFee` # sets the RubyMaker to be the fee receiver from the exchange trades (UniswapV2Factory)
3. `yarn setMakerAllowance` # sets allowance for the RubyMaker to be able to burn Ruby tokens

or `./automation_scripts/deploy_and_seed_staking.sh`
