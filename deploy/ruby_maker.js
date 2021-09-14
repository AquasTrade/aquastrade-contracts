
module.exports = async function ({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()


  const factory = (await ethers.getContract("UniswapV2Factory")).address
  const bar = (await ethers.getContract("RubyBar")).address
  const ruby = (await ethers.getContract("RubyToken")).address

  let wethAddress = (await deployments.get("WETH")).address


  await deploy("RubyMaker", {
    from: deployer,
    args: [factory, bar, ruby, wethAddress],
    log: true,
    deterministicDeployment: false
  })

  const maker = await ethers.getContract("RubyMaker")
  if (await maker.owner() !== deployer) {
    console.log("Setting maker owner")
    await (await maker.transferOwnership(deployer, true, false)).wait()
  }
}

module.exports.tags = ["RubyMaker"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyBar", "RubyToken"]