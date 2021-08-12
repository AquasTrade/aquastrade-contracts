module.exports = async function ({
                                   getNamedAccounts,
                                   deployments,
                                 }) {
  const { deploy } = deployments;

  const { deployer, dev } = await getNamedAccounts();

  await deploy("UniswapV2Factory", {
    from: deployer,
    args: [dev],
    log: true,
    deterministicDeployment: false,
  });
};

module.exports.tags = ["UniswapV2Factory", "AMM"];
