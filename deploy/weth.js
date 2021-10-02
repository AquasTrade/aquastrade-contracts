module.exports = async ({ ethers, getNamedAccounts, deployments }) => {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  await deploy("WETH", {
    from: deployer,
    log: true,
  })

};


module.exports.tags = ["WETH"];
