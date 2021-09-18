
module.exports = async function ({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()


  const factory = (await ethers.getContract("UniswapV2Factory")).address
  const mine = (await ethers.getContract("RubyMine")).address
  const ruby = (await ethers.getContract("RubyToken")).address

  let wethAddress = (await ethers.getContract("WETH")).address


  await deploy("RubyDigger", {
    from: deployer,
    args: [factory, mine, ruby, wethAddress],
    log: true,
    deterministicDeployment: false
  })

  const maker = await ethers.getContract("RubyDigger")
  if (await maker.owner() !== deployer) {
    console.log("Setting maker owner")
    await (await maker.transferOwnership(deployer, true, false)).wait()
  }
}

module.exports.tags = ["RubyDigger"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyMine", "RubyToken"]