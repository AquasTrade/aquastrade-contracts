const { utils } = require("ethers");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const amount = utils.parseUnits('1000000', 18)

  let tokenName = 'DummyToken'
  let tokenSymbol = 'DT'

  for (let i = 0; i < 10; i++ ) {

    const name = `${tokenName}${i}`;
    const symbol = `${tokenSymbol}${i}`;

    const deployRes = await deploy("MockERC20", {
        name: name,
        from: deployer,
        args: [name, symbol, amount],
        log: true,
      });

      console.log(`Token ${name}, ${symbol}:  ${deployRes.address}`)
    
  }


};
module.exports.tags = ["DummyTokensMany"];
module.exports.dependencies = ["UniswapV2Factory", "WETH"];
