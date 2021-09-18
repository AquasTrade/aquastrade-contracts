module.exports = async function ({ ethers, getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const ruby = await ethers.getContract("RubyToken")

  await deploy("RubyMine", {
    from: deployer,
    args: [ruby.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["RubyMine"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyToken"]