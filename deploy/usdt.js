const { BigNumber } = require("@ethersproject/bignumber");

module.exports = async ({ ethers, getNamedAccounts, deployments }) => {
    const { deploy } = deployments
  
    const { deployer } = await getNamedAccounts()
  
    await deploy("MockUSDT", {
      from: deployer,
      log: true
    })
  };
  
  
  module.exports.tags = ["USDT"];
  