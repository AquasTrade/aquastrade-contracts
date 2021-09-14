const  ethers = require("ethers");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();


  const amount = ethers.utils.parseUnits('1000000', 18)

  await deploy("MockERC20", {
    name: 'tERC20',
    from: deployer,
    args: ['Test ERC20', 'tERC20', amount],
    log: true,
  });



};
module.exports.tags = ["tERC20"];
module.exports.dependencies = [];
