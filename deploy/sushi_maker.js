
module.exports = async function ({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()


  const factory = (await ethers.getContract("UniswapV2Factory")).address
  const bar = (await ethers.getContract("SushiBar")).address
  const sushi = (await ethers.getContract("SushiToken")).address

  let wethAddress = (await deployments.get("WETH")).address


  await deploy("SushiMaker", {
    from: deployer,
    args: [factory, bar, sushi, wethAddress],
    log: true,
    deterministicDeployment: false
  })

  const maker = await ethers.getContract("SushiMaker")
  if (await maker.owner() !== deployer) {
    console.log("Setting maker owner")
    await (await maker.transferOwnership(deployer, true, false)).wait()
  }
}

module.exports.tags = ["SushiMaker"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "SushiBar", "SushiToken"]