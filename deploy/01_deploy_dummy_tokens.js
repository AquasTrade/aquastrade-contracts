const { utils } = require("ethers");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const token1 = await deploy("MockERC20", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    name: 'fDAI',
    from: deployer,
    args: ['Fake DAI', 'fDAI', utils.parseUnits('1000000', 18)],
    log: true,
  });


  const token2 = await deploy("MockERC20", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    name: 'fUNI',
    from: deployer,
    args: ['Fake Uniswap', 'fUNI', utils.parseUnits('1000000', 18)],
    log: true,
  });

  const factoryAddress = (await deployments.get("UniswapV2Factory")).address;
  const wethAddress = (await deployments.get("WETH")).address;

  const uniFactory = await ethers.getContractAt('UniswapV2Factory', factoryAddress)

  await uniFactory.createPair(wethAddress, token1.address);
  await uniFactory.createPair(wethAddress, token2.address);



};
module.exports.tags = ["DummyTokens"];
module.exports.dependencies = ["UniswapV2Factory", "WETH"];
