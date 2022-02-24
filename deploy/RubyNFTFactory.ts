// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { DeployFunction } from "hardhat-deploy/types";

// const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   const { deployments, getNamedAccounts, ethers } = hre;
//   const { deploy, getOrNull, log } = deployments;
//   const { deployer } = await getNamedAccounts();

//   const RubyNFTFactory = await getOrNull("RubyNFTFactory");
//   const maxAmountOfNfts = 5;

//   if (RubyNFTFactory) {
//     log(`reusing "RubyNFTFactory" at ${RubyNFTFactory.address}`);
//   } else {
//     await deploy("RubyNFTFactory", {
//       from: deployer,
//       log: true,
//       proxy: {
//         viaAdminContract: "RubyProxyAdmin",
//         proxyContract: "OpenZeppelinTransparentProxy",
//         execute: {
//           methodName: "initialize",
//           args: [deployer, maxAmountOfNfts],
//         },
//       },
//       skipIfAlreadyDeployed: true,
//     });
//   }
// };
// export default func;

// func.dependencies = ["RubyProxyAdmin"];
// func.tags = ["RubyNFTFactory"];
