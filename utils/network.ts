export const CHAIN_ID = {
  HARDHAT: "31337",
  LOCALHOST: "1337",
  SKALE_TESTCHAIN: "2197884595910940",
  SKALE_MAINNET: "",
};

export function isMainnet(networkId: string): boolean {
  return networkId == CHAIN_ID.SKALE_MAINNET;
}

export function isTestNetwork(networkId: string): boolean {
  return networkId == CHAIN_ID.HARDHAT || networkId == CHAIN_ID.LOCALHOST;
}
