Please refer to [the main multisig instructions](./DEPLOYMENT_EUROPA_MULTISIG.md) for complete
instructions.

This document is mostly a record of the many commands that must be executed in the MS

### Deployment Preparation

From [preparation steps](./DEPLOYMENT_EUROPA_MULTISIG.md#preparation):
 1. not required
 2. done (using goerli `message_proxy_mainnet_address`)  
    `0x08913E0DC2BA60A1626655581f701bCa84f42324`
 3. done (to dev deployer `0xF63Bb14E7E9bD2882957129c3E3197E6D18933B4`)
 4. not required, predeployed MSW will handle all extra roles

#### IMA Config (per-token)

* Goerli DepostBoxERC20  
  `0x2F4B31e661955d41bd6ab5530b117758C26C8159` from [here](https://github.com/skalenetwork/skale-network/blob/42034e51f494916da2ed155c53f7cd03134b7944/releases/staging-v3/IMA/1.3.2-stable.1/mainnet/ima.json#L2981)
* Goerli ABI  
  can copy paste into safe from [here](https://raw.githubusercontent.com/skalenetwork/skale-network/master/releases/staging-v3/IMA/1.3.2-stable.1/mainnet/ima.json)

##### Modify the generator script

```patch
diff --git a/scripts/bridging/gen_registerTokensToIMA_MULTISIG.py b/scripts/bridging/gen_registerTokensToIMA_MULTISIG.py
index fb6f92b..a52489c 100644
--- a/scripts/bridging/gen_registerTokensToIMA_MULTISIG.py
+++ b/scripts/bridging/gen_registerTokensToIMA_MULTISIG.py
@@ -2,8 +2,8 @@ import subprocess
 import json
 import os.path
 
-L2_DEPLOYMENT_DIR = os.path.expanduser("~/Ruby/backend/deployments/europa")
-L1_DEPLOYMENT_ADDRS = os.path.expanduser("~/Ruby/backend/deployment_addresses/l1_erc20s.json")
+L2_DEPLOYMENT_DIR = os.path.expanduser("~/Ruby/backend/deployments/stagingv3")
+L1_DEPLOYMENT_ADDRS = os.path.expanduser("~/Ruby/backend/deployment_addresses/l1_goerli_erc20s.json")
 
 def get_l1_addr(symbol):
     with open(L1_DEPLOYMENT_ADDRS) as f:
@@ -28,9 +28,9 @@ if __name__ == "__main__":
         print(t)
 
         # L1:DeployBox.addERC20TokenByOwner
-        print('addERC20TokenByOwner("elated-tan-skat", "%s")' % l1)
+        print('addERC20TokenByOwner("staging-legal-crazy-castor", "%s")' % l1)
         # L2:
-        print('npx msig encodeData elated-tan-skat TokenManagerERC20 addERC20TokenByOwner Mainnet %s %s' % (l1, l2))
+        print('npx msig encodeData staging-legal-crazy-castor TokenManagerERC20 addERC20TokenByOwner Mainnet %s %s' % (l1, l2))
 
         print('\n')
```

* Addresses
  * L1: IMA/message_proxy_mainnet_address: `0x08913E0DC2BA60A1626655581f701bCa84f42324`
  * L1: depost_box_erc20_address: `0x2F4B31e661955d41bd6ab5530b117758C26C8159`

* RUBY
```
addERC20TokenByOwner("staging-legal-crazy-castor", "0xd66641E25E9D36A995682572eaD74E24C11Bb422")
npx msig encodeData staging-legal-crazy-castor TokenManagerERC20 addERC20TokenByOwner Mainnet 0xd66641E25E9D36A995682572eaD74E24C11Bb422 0xf06De9214B1Db39fFE9db2AebFA74E52f1e46e39
```

* DAI
```
addERC20TokenByOwner("staging-legal-crazy-castor", "0x83B38f79cFFB47CF74f7eC8a5F8D7DD69349fBf7")
npx msig encodeData staging-legal-crazy-castor TokenManagerERC20 addERC20TokenByOwner Mainnet 0x83B38f79cFFB47CF74f7eC8a5F8D7DD69349fBf7 0x3595E2f313780cb2f23e197B8e297066fd410d30
```

* SKL
```
addERC20TokenByOwner("staging-legal-crazy-castor", "0x493D4442013717189C9963a2e275Ad33bfAFcE11")
npx msig encodeData staging-legal-crazy-castor TokenManagerERC20 addERC20TokenByOwner Mainnet 0x493D4442013717189C9963a2e275Ad33bfAFcE11 0xbA1E9BA7CDd4815Da6a51586bE56e8643d1bEAb6
```

* USDP
```
addERC20TokenByOwner("staging-legal-crazy-castor", "0x66259E472f8d09083ecB51D42F9F872A61001426")
npx msig encodeData staging-legal-crazy-castor TokenManagerERC20 addERC20TokenByOwner Mainnet 0x66259E472f8d09083ecB51D42F9F872A61001426 0xe0E2cb3A5d6f94a5bc2D00FAa3e64460A9D241E1
```

* USDT
```
addERC20TokenByOwner("staging-legal-crazy-castor", "0xD1E44e3afd6d3F155e7704c67705E3bAC2e491b6")
npx msig encodeData staging-legal-crazy-castor TokenManagerERC20 addERC20TokenByOwner Mainnet 0xD1E44e3afd6d3F155e7704c67705E3bAC2e491b6 0xa388F9783d8E5B0502548061c3b06bf4300Fc0E1
```

* USDC
```
addERC20TokenByOwner("staging-legal-crazy-castor", "0x85dedAA65D33210E15911Da5E9dc29F5C93a50A9")
npx msig encodeData staging-legal-crazy-castor TokenManagerERC20 addERC20TokenByOwner Mainnet 0x85dedAA65D33210E15911Da5E9dc29F5C93a50A9 0x5d42495D417fcd9ECf42F3EA8a55FcEf44eD9B33
```

* WBTC
```
addERC20TokenByOwner("staging-legal-crazy-castor", "0xd80BC0126A38c9F7b915e1B2B9f78280639cadb3")
npx msig encodeData staging-legal-crazy-castor TokenManagerERC20 addERC20TokenByOwner Mainnet 0xd80BC0126A38c9F7b915e1B2B9f78280639cadb3 0xf5E880E1066DDc90471B9BAE6f183D5344fd289F
```

