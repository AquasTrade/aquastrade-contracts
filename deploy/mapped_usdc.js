const  ethers = require("ethers");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();


  await deploy("SkaleMappedERC20Token", {
    name: 'rUSDC',
    from: deployer,
    args: ['ruby USDC', 'rubyUSDC', ethers.BigNumber.from(6)],
    log: true,
  });



};
module.exports.tags = ["rubyUSDC"];
module.exports.dependencies = [];
