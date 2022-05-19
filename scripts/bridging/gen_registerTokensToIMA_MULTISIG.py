import subprocess
import json
import os.path

L2_DEPLOYMENT_DIR = os.path.expanduser("~/Ruby/backend/deployments/europa")
L1_DEPLOYMENT_ADDRS = os.path.expanduser("~/Ruby/backend/deployment_addresses/l1_erc20s.json")

def get_l1_addr(symbol):
    with open(L1_DEPLOYMENT_ADDRS) as f:
        dat = json.load(f)
        return dat[symbol]['address']

def get_l2_addr(symbol):
    if symbol == 'RUBY':
        fn = 'RubyToken.json'
    else:
        fn = 'Ruby%s.json' % symbol
    with open(os.path.join(L2_DEPLOYMENT_DIR, fn)) as f:
        dat = json.load(f)
        return dat['address']

if __name__ == "__main__":
    TOKENS = "RUBY", "DAI", "SKL", "USDP", "USDT", "USDC", "WBTC"
    for t in TOKENS:
        l1 = get_l1_addr(t)
        l2 = get_l2_addr(t)

        print(t)

        # L1:DeployBox.addERC20TokenByOwner
        print('addERC20TokenByOwner("elated-tan-skat", "%s")' % l1)
        # L2:
        print('npx msig encodeData elated-tan-skat TokenManagerERC20 addERC20TokenByOwner Mainnet %s %s' % (l1, l2))

        print('\n')

