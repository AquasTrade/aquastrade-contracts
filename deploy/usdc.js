const { BigNumber } = require("@ethersproject/bignumber");

module.exports = async ({ ethers, getNamedAccounts, deployments }) => {
    const { deploy } = deployments
  
    const { deployer } = await getNamedAccounts()
   
    await deploy("MockUSDC", {
        from: deployer,
        log: true
      })
  
  };
  
  
  module.exports.tags = ["USDC"];
  