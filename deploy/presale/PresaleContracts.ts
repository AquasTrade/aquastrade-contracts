import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

import investorsReal from "./presale.json"
import investorsTesting from "./presale.rubyNewChain.json"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  // time of launch
  const TIMESTAMP_NOW = 1658002873 // Sat Jul 16 2022 20:21:13 GMT+0000

  const DURATION_12MO = 60 * 60 * 24 * 365
  const DURATION_18MO = 60 * 60 * 24 * 548
  const DURATION_48MO = 60 * 60 * 24 * 365 * 4

  const investors = (network.name === "rubyNewChain") ? investorsTesting : investorsReal;

  for (let addr of investors.duration12mo) {
      await deploy(`Presale_${addr.toLowerCase()}`, {
        contract: "Vester",
        from: deployer,
        args: [
          addr.toLowerCase(),
          TIMESTAMP_NOW,
          0,
          DURATION_12MO,
          true
        ],
        log: true,
        deterministicDeployment: false,
      });
  };

  for (let addr of investors.duration18mo) {
      await deploy(`Presale_${addr.toLowerCase()}`, {
        contract: "Vester",
        from: deployer,
        args: [
          addr.toLowerCase(),
          TIMESTAMP_NOW,
          0,
          DURATION_18MO,
          true
        ],
        log: true,
        deterministicDeployment: false,
      });
  };

  for (let addr of investors.duration48mo) {
      await deploy(`Presale_${addr.toLowerCase()}`, {
        contract: "Vester",
        from: deployer,
        args: [
          addr.toLowerCase(),
          TIMESTAMP_NOW,
          0,
          DURATION_48MO,
          true
        ],
        log: true,
        deterministicDeployment: false,
      });
  };

};
func.tags = ["PresaleContracts"];

export default func;
