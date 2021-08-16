const  ethers = require("ethers");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();


  await deploy("MockERC721Token", {
    name: 't721',
    from: deployer,
    args: ['TestERC721', 't721'],
    log: true,
  });



};
module.exports.tags = ["t721"];
module.exports.dependencies = [];
