const { utils } = require("ethers");
const {getAddresses} = require('../utils/addresses')
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const addresses = getAddresses();

  const token1 = await deploy("MockERC20", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ['Fake DAI', 'fDAI', utils.parseUnits('1000000', 18)],
    log: true,
  });


  const token2 = await deploy("MockERC20", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ['Fake Uniswap', 'fUNI', utils.parseUnits('1000000', 18)],
    log: true,
  });


  const uniFactory = await ethers.getContractAt('UniswapV2Factory', addresses.uniswapV2Factory) //<-- if you want to instantiate a version of a contract at a specific address!

  await uniFactory.createPair(addresses.WETH, token1.address);
  await uniFactory.createPair(addresses.WETH, token2.address);



};
module.exports.tags = ["MockERC20"];
