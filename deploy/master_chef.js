module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const sushi = await ethers.getContract("SushiToken")

  const { address } = await deploy("MasterChef", {
    from: deployer,
    args: [sushi.address, deployer, "1000000000000000000000", "0", "1000000000000000000000"],
    log: true,
    deterministicDeployment: false
  })

  if (await sushi.owner() !== address) {
    // Transfer Sushi Ownership to Chef
    console.log("Transfer Sushi Ownership to Chef")
    await (await sushi.transferOwnership(address)).wait()
  }

  const masterChef = await ethers.getContract("MasterChef")
  if (await masterChef.owner() !== deployer) {
    // Transfer ownership of MasterChef to deployer
    console.log("Transfer ownership of MasterChef to deployer")
    await (await masterChef.transferOwnership(deployer)).wait()
  }
}

  module.exports.tags = ["MasterChef"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "SushiToken"]