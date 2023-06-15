#!/usr/bin/env python3

import json
import os.path
import argparse
import glob


OWNABLE_ABI_INPUTS = [
    {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
    }
]


BORING_OWNABLE_ABI_INPUTS = [
    {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
    },
    {
        "internalType": "bool",
        "name": "direct",
        "type": "bool"
    },
    {
        "internalType": "bool",
        "name": "renounce",
        "type": "bool"
    }
]


GRANT_ROLE_ABI_INPUTS = [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ]


SET_ADDRESS_ABI_INPUTS = [
    {
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
    }
]


def _is_function(entry, name):
    return entry.get('type') == 'function' and entry.get('name') == name


def is_set_admin(abi):
    for entry in abi:
        if _is_function(entry, 'setAdmin'):
            if entry['inputs'] == SET_ADDRESS_ABI_INPUTS:
                return "setAdmin"
    return None


def is_ownable(abi):
    for entry in abi:
        if _is_function(entry, 'transferOwnership'):
            if entry['inputs'] == OWNABLE_ABI_INPUTS:
                return "Ownable"
            elif entry['inputs'] == BORING_OWNABLE_ABI_INPUTS:
                return "BoringOwnable"
    return None


def is_access_control(abi):
    def _has_grantrole():
        for entry in abi:
            if _is_function(entry, 'grantRole'):
                if entry['inputs'] == GRANT_ROLE_ABI_INPUTS:
                    return "GrantRole"

    def _has_def_admin():
        for entry in abi:
            if _is_function(entry, 'DEFAULT_ADMIN_ROLE'):
                return True

    if _has_def_admin():
        return _has_grantrole()
        

def parse_artifact(path):
    with open(path, 'rt') as f:
        name = os.path.basename(path)
        dat = json.load(f)
        addy = dat['address']
        abi = dat['abi']

        io = is_ownable(abi)
        iac = is_access_control(abi)
        if io and iac:
            raise Exception('%s is both Ownable and AccessControl' % name)

        isa = is_set_admin(abi)

        if io:
            return io, name, addy
        elif iac:
            return iac, name, addy
        elif isa:
            return isa, name, addy
        else:
            return None, name, addy


if __name__ == "__main__":
    import pprint

    types = {'Ownable': [],
             'BoringOwnable': [],
             'GrantRole': [],
             'setAdmin': [],
             '_Implementation.json': [],
             None: []
    }

    parser = argparse.ArgumentParser()
    parser.add_argument('--network', help='network containing all deployments', default='europa')
    parser.add_argument('--file', help='json deployment artifact')
    args = parser.parse_args()

    if args.file:
        print(parse_artifact(args.file))
    elif args.network:
        print('NETWORK:', args.network)
        d = os.path.join(os.path.dirname(__file__), '..', '..', 'deployments', args.network)
        for p in glob.glob(os.path.join(d, '*.json')):
            if p.endswith('_Implementation.json'):
                types['_Implementation.json'].append(os.path.basename(p))
                continue

            res = parse_artifact(p)
            types[res[0]].append(res[1:])
    else:
        raise parser.error('specify one of --network or --file')

    pprint.pprint(types, width=120)
