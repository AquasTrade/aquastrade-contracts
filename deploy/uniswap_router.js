


module.exports = async function ({ ethers, getNamedAccounts, deployments }) {
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();


  const wethAddress = (await ethers.getContract("WETH")).address;
  const factoryAddress = (await ethers.getContract("UniswapV2Factory")).address;

  await deploy("UniswapV2Router02", {
    from: deployer,
    args: [factoryAddress, wethAddress],
    log: true,
    deterministicDeployment: false,
  });
};

module.exports.tags = ["UniswapV2Router02", "AMM"];
module.exports.dependencies = ["UniswapV2Factory", "WETH"];