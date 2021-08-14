module.exports = async function ({
                                   getNamedAccounts,
                                   deployments,
                                 }) {
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const factoryDeployment= await deploy("UniswapV2Factory", {
    from: deployer,
    args: [deployer],
    log: true,
    deterministicDeployment: false,
  });

  const factory = await ethers.getContractAt('UniswapV2Factory', factoryDeployment.address)


  const codeHash = await factory.pairCodeHash();
  console.log("init code hash", codeHash);

};

module.exports.tags = ["UniswapV2Factory", "AMM"];
