const { utils } = require("ethers");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const amount = utils.parseUnits('1000000', 18)

  const token1 = await deploy("MockERC20", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    name: 'fDAI',
    from: deployer,
    args: ['Fake DAI', 'fDAI', amount],
    log: true,
  });


  const token2 = await deploy("MockERC20", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    name: 'fUNI',
    from: deployer,
    args: ['Fake Uniswap', 'fUNI',  amount],
    log: true,
  });

  const factoryAddress = (await deployments.get("UniswapV2Factory")).address;
  const wethAddress = (await deployments.get("WETH")).address;
  const routerAddress = (await deployments.get("UniswapV2Router02")).address;

  const uniFactory = await ethers.getContractAt('UniswapV2Factory', factoryAddress)

  const token1contract = await ethers.getContractAt('MockERC20', token1.address)
  const token2contract = await ethers.getContractAt('MockERC20', token2.address)

  await token1contract.approve(routerAddress, amount );
  await token2contract.approve(routerAddress, amount);


  await uniFactory.createPair(wethAddress, token1.address);
  await uniFactory.createPair(wethAddress, token2.address);



};
module.exports.tags = ["DummyTokens"];
module.exports.dependencies = ["UniswapV2Factory", "WETH"];
