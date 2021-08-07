const hre = require('hardhat');

const addresses = {
  skale: {

  },
  skaleTestnet: {
    uniswapV2Factory: '0xFA98329F326cEea8a109203DE7d7f1482EdBA5EF',
    WETH: '0x5130671d7Fa7DfF128567aC992289f436CC0B063',
  }
}

const getAddresses = () => {
  return addresses[hre.network.name];
}

module.exports = {
  getAddresses
};