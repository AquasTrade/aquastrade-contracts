const hre = require('hardhat');

const addresses = {
  skale: {

  },
  skaleTestnet: {
    UniswapV2Factory: '0xFA98329F326cEea8a109203DE7d7f1482EdBA5EF',
    UniswapV2Router: '0xFA98329F326cEea8a109203DE7d7f1482EdBA5EF',
    fUNI: '0xFA98329F326cEea8a109203DE7d7f1482EdBA5EF',
    fDAI: '0xFA98329F326cEea8a109203DE7d7f1482EdBA5EF',
    WETH: '0x5130671d7Fa7DfF128567aC992289f436CC0B063',
    deployer: '0xF63Bb14E7E9bD2882957129c3E3197E6D18933B4',
  },
  localhost: {
    UniswapV2Factory: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    UniswapV2Router: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    fUNI: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    fDAI: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    WETH: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  }
}

const getAddresses = () => {
  return addresses[hre.network.name];
}

module.exports = {
  getAddresses
};