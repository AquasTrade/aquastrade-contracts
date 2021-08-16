const  ethers = require("ethers");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();


  await deploy("SkaleMappedERC721Token", {
    name: 'rubyT721',
    from: deployer,
    args: ['ruby TestERC721', 'rubyT721'],
    log: true,
  });



};
module.exports.tags = ["rubyT721"];
module.exports.dependencies = [];
