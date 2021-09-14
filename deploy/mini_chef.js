module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()


  let rubyAddress = (await deployments.get("RubyToken")).address;

  await deploy("MiniChefV2", {
    from: deployer,
    args: [rubyAddress],
    log: true,
    deterministicDeployment: false
  })

  const miniChefV2 = await ethers.getContract("MiniChefV2")
  if (await miniChefV2.owner() !== deployer) {
    console.log("Transfer ownership of MiniChef to deployer")
    await (await miniChefV2.transferOwnership(deployer, true, false)).wait()
  }
}

module.exports.tags = ["MiniChefV2"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "RubyToken"]