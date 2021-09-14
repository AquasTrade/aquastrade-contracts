module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const ruby = await ethers.getContract("RubyToken")

  const { address } = await deploy("MasterChef", {
    from: deployer,
    args: [ruby.address, deployer, "10000000000000000000", "0", "1000000000000000000000"],
    log: true,
    deterministicDeployment: false
  })

  if (await ruby.owner() !== address) {
    // Transfer Ruby Ownership to Chef
    console.log("Transfer Ruby Ownership to Chef")
    await (await ruby.transferOwnership(address)).wait()
  }

  const masterChef = await ethers.getContract("MasterChef")
  if (await masterChef.owner() !== deployer) {
    // Transfer ownership of MasterChef to deployer
    console.log("Transfer ownership of MasterChef to deployer")
    await (await masterChef.transferOwnership(deployer)).wait()
  }
}

  module.exports.tags = ["MasterChef"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyToken"]