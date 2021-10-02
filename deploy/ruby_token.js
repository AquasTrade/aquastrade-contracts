const { ethers } = require("hardhat")

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  await deploy("RubyToken", {
    from: deployer,
    log: true,
    deterministicDeployment: false
  })


const ruby = await ethers.getContract('RubyToken');
await ruby.mint(deployer, ethers.utils.parseUnits("100000000"));
const balance = await ruby.balanceOf(deployer);
console.log(`ruby balance ${ethers.utils.formatUnits(balance)}`)
}

module.exports.tags = ["RubyToken"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]