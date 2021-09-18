module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
    const { deploy } = deployments;
  
    const { deployer, treasury } = await getNamedAccounts();
  
    const ruby = await ethers.getContract("RubyToken");
  
    const { address } = await deploy("RubyMasterChef", {
      from: deployer,
      args: [
        ruby.address,
        deployer,
        treasury,
        "10000000000000000000", // 10 RUBY per sec
        "1631948400", // Sat Sep 18 09:00
        "100" // 10%
      ],
      log: true,
      deterministicDeployment: false,
    });
  
    if ((await ruby.owner()) !== address) {
      // Transfer Ruby Ownership to RubyMasterChef
      console.log("Transfer Ruby Ownership to RubyMasterChef");
      await (await ruby.transferOwnership(address)).wait();
    }
  };
  
  module.exports.tags = ["RubyMasterChef"];
  module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyToken"]