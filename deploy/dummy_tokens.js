const { utils } = require("ethers");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const amount = utils.parseUnits('1000000', 18)

  await deploy("MockERC20", {
    name: 'fDAI',
    from: deployer,
    args: ['Fake DAI', 'fDAI', amount],
    log: true,
  });


  await deploy("MockERC20", {
    name: 'fUNI',
    from: deployer,
    args: ['Fake Uniswap', 'fUNI',  amount],
    log: true,
  });


};
module.exports.tags = ["DummyTokens"];
module.exports.dependencies = ["UniswapV2Factory", "WETH"];
