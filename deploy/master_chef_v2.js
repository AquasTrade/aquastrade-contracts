module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
    const { deploy } = deployments
  
    const { deployer } = await getNamedAccounts()
  
    const ruby = await ethers.getContract("RubyToken")
    const masterChef = await ethers.getContract("MasterChef")
    const dummyToken = await ethers.getContract("MasterChefDummyToken");
    const masterChefPid = 0; // TODO change
  
    const { address } = await deploy("MasterChefV2", {
      from: deployer,
      args: [masterChef.address, ruby.address, masterChefPid],
      log: true,
      deterministicDeployment: false
    })

    const masterChefV2 = await ethers.getContract("MasterChefV2")

    await masterChefV2.init(dummyToken.address);
  }
  
    module.exports.tags = ["MasterChefV2"]
  module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "MasterChef", "RubyToken", "MasterChefDummyToken"]