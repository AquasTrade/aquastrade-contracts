module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const ruby = await deployments.get("RubyToken")

  await deploy("RubyBar", {
    from: deployer,
    args: [ruby.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["RubyBar"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyToken"]