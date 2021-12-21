## Usage guide

#### Install:

`yarn`

#### Local setup:

Start local chain:

`yarn chain`

#### Deployments:

The default network specified in `hardhat.config.ts` would be used for the deployments. This can be either overriden in the file, or by adding `--network {NETWORK}`, e.g:

##### Mock tokens:

1. `yarn deploy --tags MockUSDC`
2. `yarn deploy --tags MockUSDP`
3. `yarn deploy --tags MockUSDT`
4. `yarn deploy --tags MockDAI`
5. `yarn deploy --tags MockETH` (only for localhost testing)
or

`yarn deploy --tags MockTokens`
`yarn deploy --tags MockETH` (only for localhost testing)

##### Mapped tokens (L2):

1. `yarn deploy --tags RubyUSDC`
2. `yarn deploy --tags RubyUSDP`
3. `yarn deploy --tags RubyUSDT`
3. `yarn deploy --tags RubyDAI`

or

`yarn deploy --tags MappedTokens`

##### RubyToken:

1. `yarn deploy --tags RubyTokenMainnet` # L1 (i.e Mainnet, Rinkeby)
2. `yarn deploy --tags RubyToken` # L2 (i.e Skale, Skale testchain)

##### AMM:

1. `yarn deploy --tags UniswapV2Factory`
2. `yarn deploy --tags UniswapV2Router02`

or

`yarn deploy --tags AMM`

##### Ruby Staking:

1. `yarn deploy --tags RubyStaker`
2. `yarn deploy --tags RubyMaker`

or

`yarn deploy --tags Staking`

##### Set AMM FeeTaker:

1. `yarn setAMMFeeTaker`

##### Farm:

1. Deploy ruby token if not deployed `yarn deploy --tags RubyTokenMainnet` or `yarn deploy --tags RubyToken`
2. Deploy RubyMasterChef `yarn deploy --tags RubyMasterChef`
3. Seed RubyMasterChef with RUBY tokens `yarn transferRubyTokensToMasterChef`


##### Setup staking rewards:

1. `yarn setRubyStakerRewards`;

##### Stable swap:

1. `yarn deploy --tags Allowlist`
2. `yarn deploy --tags AmplificationUtils`
3. `yarn deploy --tags SwapUtils`
4. `yarn deploy --tags LPToken`
5. `yarn deploy --tags SwapDeployer`
6. `yarn deploy --tags Swap`
7. `yarn deploy --tags RubyUSD4Pool`

or

`yarn deploy --tags StableSwap`

##### Seed the stable pool:
1. `yarn seedRubyStablePool`

##### Ruby router:

1. `yarn deploy --tags RubyRouter`

##### Utils:

1. `yarn deploy --tags Multicall2`

##### Governance:

1. `yarn deploy --tags Timelock`

---

#### Init code hash:

`yarn generateInitCodeHash`

Localhost: `0x0a7459fd509713423fae10bc598e33f725397f71fd0785bbecc2a4745e162beb`
Schain: `0x2bfb5824af31b0cc04980713da1d6ca3547ed3cc8712a91792c94a83e22871ae`

---

#### Deployment addresses:

##### Rinkeby:

```
    USDC: 0x26932cA71E2C102BAaBB52b3E6F2c648707004a6
    USDT: 0xC5e3e32451a3fb52D6019DEC7C6C63EfC90d507B
    USDP: 0x1245Fb38D4D682C0bFF92b98a6BD34250664e02C
    DAI: 0x24057222E5727d2ac3c1faBa71BBA17D78aa718f
    RubyToken: 0x5eE8f83E21D0C97e793846943Cb0c5D815002Cc5
```

##### SKALE testnet:

```
Contracts:
    UniswapV2Factory: '0xf4AE81169A0b39f3BaF7cb087CDeb5318E24f960',
    UniswapV2Router: '0x590061c24Df37767122DC4D99B07707CDCf54809',
    USDC: '0x788c12145E5E15717020095172d3471Fd6C0569f',
    USDT: '0x9DBFcCd94c26cd219b60754215abcC32c26F41c2',
    USDP: '0x0EB4a542fcCBe6c985Eaa08e7A5De0f27cb50938',
    DAI: '0x059Fc87C315c659Bc11B0F7F524d20413A4A0fAC',
    RubyToken: '0x58F2b35dde559F49B9870Ec101c3b1B8433C644d',
    RubyMasterChef: '0x930EFfe96e019D5897Ff4a70187bb80544ac4Ba9',
    RubyMaker: '0x04849a382e300ca2fC213E471887f2BC48a72e58',
    RubyStaker: '0xD0939984e7449D4E772C1EFd82bDc5e020B1d732',
    RubyRouter: '0x7EbFAA00C41b09fC6d16038acA21b916bEeA2C0c',
    RubyUSD4Pool: '0xc06F44513915A0d949c80719460636Bb7148206d',
    RubyUSD4PoolLPToken: '0x3CA4C4bB83bE8d56a7CD2649f5181AeC5fd007b7',
    Multicall2: '0x74a5cb6b214a8311BA3a682b3d129D0d4cD1fdC8',
    ETHC: '0xD2Aaa00700000000000000000000000000000000' // bridged ETH
```
