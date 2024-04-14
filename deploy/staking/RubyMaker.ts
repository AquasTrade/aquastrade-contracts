import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts, network } = hre;
  const { deploy, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  let RUBY_MAKER_ADDRESS;
  const RubyMaker = await getOrNull("RubyMaker");

  const FACTORY_ADDRESS = (await ethers.getContract("UniswapV2Factory")).address;
  const RUBY_STAKER_ADDRESS = (await ethers.getContract("RubyStaker")).address;
  const USDP_TOKEN_ADDRESS = (await ethers.getContract("RubyUSDP")).address;

  let rubyToken;
  if (network.name === "localhost") {
    rubyToken = await ethers.getContract("RubyTokenMainnet");
  } else {
    rubyToken = await ethers.getContract("RubyToken");
  }

  const RUBY_TOKEN_ADDRESS = rubyToken.address;
  const burnPercent = BigNumber.from("20"); // 20 percent

  if (RubyMaker) {
    log(`reusing "RubyMaker" at ${RubyMaker.address}`);
    RUBY_MAKER_ADDRESS = RubyMaker.address;
  } else {
    const contract = await deploy("RubyMaker", {
      from: deployer,
      log: true,
      proxy: {
        viaAdminContract: "RubyProxyAdmin",
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [deployer, FACTORY_ADDRESS, RUBY_STAKER_ADDRESS, RUBY_TOKEN_ADDRESS, USDP_TOKEN_ADDRESS, burnPercent],
        },
      },
      skipIfAlreadyDeployed: true,
    });
    RUBY_MAKER_ADDRESS = contract.address;
  }

  const burnerRole = await rubyToken.BURNER_ROLE();
  if ((await rubyToken.hasRole(burnerRole, RUBY_MAKER_ADDRESS)) === false) {
    let res = await rubyToken.grantRole(burnerRole, RUBY_MAKER_ADDRESS);
    await res.wait(1);
    log(`granted RubyToken.BURNER_ROLE to RubyMaker@${RUBY_MAKER_ADDRESS}`);
  }
};

func.tags = ["RubyMaker", "Staking"];
func.dependencies = ["RubyStaker", "UniswapV2Factory", "RubyProxyAdmin"];

export default func;
